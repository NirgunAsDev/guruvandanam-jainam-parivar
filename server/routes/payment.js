const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const config = require('../config');

// Apply JSON parsing for non-webhook routes (router is mounted before global express.json())
router.use((req, res, next) => {
  if (req.path === '/webhook') return next(); // webhook needs raw body
  express.json()(req, res, next);
});

// Lazy-init so server starts even before real keys are configured
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

const AMOUNT = config.REGISTRATION_FEE_PAISE; // in paise
const CURRENCY = 'INR';

// ─── Helpers ────────────────────────────────────────────────────────────────

function logPayment({ user_id, order_id = '', payment_id = '', event, status = '', reason = '', raw_payload = '' }) {
  try {
    db.prepare(
      `INSERT INTO payment_logs (user_id, order_id, payment_id, event, status, reason, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(user_id, order_id, payment_id, event, status, reason,
      typeof raw_payload === 'string' ? raw_payload : JSON.stringify(raw_payload));
  } catch (_) { /* never let logging crash the main flow */ }
}

// Per-user rate limiter for create-order (5 per minute)
const createOrderAttempts = new Map();
function isRateLimited(userId) {
  const now = Date.now();
  const attempts = (createOrderAttempts.get(userId) || []).filter(t => now - t < 60_000);
  if (attempts.length >= 5) return true;
  createOrderAttempts.set(userId, [...attempts, now]);
  return false;
}

// Wrap a promise with a timeout
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

// ─── POST /api/payment/create-order ─────────────────────────────────────────

router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isRateLimited(userId)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    const user = db.prepare('SELECT registration_fee_paid FROM users WHERE id = ?').get(userId);

    if (user.registration_fee_paid === 1) {
      return res.status(400).json({ error: 'Registration fee already paid.' });
    }

    // Always create a fresh order — reusing a cached order risks replaying
    // one that Razorpay has since deemed invalid (e.g. after a key rotation),
    // which would trap the user in a permanent "order is invalid" loop.
    const nowSec = Math.floor(Date.now() / 1000);
    const order = await getRazorpay().orders.create({
      amount: AMOUNT,
      currency: CURRENCY,
      receipt: `reg_${userId}`, // informational only — never trusted for security
    });

    db.prepare(
      'UPDATE users SET pending_order_id = ?, pending_order_at = ? WHERE id = ?'
    ).run(order.id, nowSec, userId);

    logPayment({ user_id: userId, order_id: order.id, event: 'create_order', status: 'ok' });

    return res.json({
      orderId: order.id,
      amount: AMOUNT,
      currency: CURRENCY,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
  }
});

// ─── POST /api/payment/verify ────────────────────────────────────────────────

router.post('/verify', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields.' });
  }

  try {
    const userId = req.user.id;
    const user = db.prepare(
      'SELECT registration_fee_paid, razorpay_payment_id AS confirmed_payment_id, pending_order_id FROM users WHERE id = ?'
    ).get(userId);

    // Step 1 — Idempotency
    if (user.registration_fee_paid === 1) {
      if (user.confirmed_payment_id === razorpay_payment_id) {
        return res.json({ success: true }); // safe re-call
      }
      logPayment({ user_id: userId, payment_id: razorpay_payment_id, event: 'duplicate_attempt', reason: 'Already paid with different payment' });
      return res.status(400).json({ error: 'Registration fee already paid with a different payment.' });
    }

    // Step 2 — Validate order_id belongs to this user (CRITICAL)
    if (razorpay_order_id !== user.pending_order_id) {
      logPayment({ user_id: userId, order_id: razorpay_order_id, payment_id: razorpay_payment_id, event: 'verify_fail', reason: 'Order mismatch' });
      return res.status(400).json({ error: 'Order does not belong to this account.' });
    }

    // Step 3 — Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      logPayment({ user_id: userId, order_id: razorpay_order_id, payment_id: razorpay_payment_id, event: 'verify_fail', reason: 'Signature mismatch' });
      return res.status(400).json({ error: 'Invalid payment signature.' });
    }

    // Step 4 — Validate payment via Razorpay API (with 5s timeout)
    let payment;
    try {
      payment = await withTimeout(getRazorpay().payments.fetch(razorpay_payment_id), 5000);
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        return res.status(503).json({ error: 'Payment verification temporarily unavailable. Please try again shortly.' });
      }
      throw err;
    }

    if (payment.amount !== AMOUNT || payment.currency !== CURRENCY || payment.order_id !== razorpay_order_id) {
      logPayment({ user_id: userId, order_id: razorpay_order_id, payment_id: razorpay_payment_id, event: 'verify_fail', reason: 'Amount/currency/order mismatch', raw_payload: payment });
      return res.status(400).json({ error: 'Payment validation failed. Contact support.' });
    }

    if (payment.status === 'authorized') {
      // Captured later — tell client to retry
      return res.status(202).json({ retryable: true, message: 'Payment authorized, awaiting capture. Please wait a moment.' });
    }

    if (payment.status !== 'captured') {
      logPayment({ user_id: userId, order_id: razorpay_order_id, payment_id: razorpay_payment_id, event: 'verify_fail', reason: `Unexpected status: ${payment.status}` });
      return res.status(400).json({ error: 'Payment not completed. Please try again.' });
    }

    // Step 5 — DB-level idempotent persist
    const result = db.prepare(`
      UPDATE users
      SET registration_fee_paid = 1,
          razorpay_payment_id   = ?,
          pending_order_id      = '',
          pending_order_at      = 0
      WHERE id = ? AND registration_fee_paid = 0
    `).run(razorpay_payment_id, userId);

    if (result.changes === 0) {
      // Concurrent request already processed it
      return res.json({ success: true });
    }

    logPayment({ user_id: userId, order_id: razorpay_order_id, payment_id: razorpay_payment_id, event: 'verify_success', status: 'ok' });
    return res.json({ success: true });

  } catch (err) {
    console.error('verify error:', err);
    return res.status(500).json({ error: 'Server error during verification. Contact support.' });
  }
});

// ─── POST /api/payment/webhook ───────────────────────────────────────────────
// Raw body required — handled by express.raw() middleware applied inline below

router.post('/webhook',
  express.raw({ type: '*/*' }),
  (req, res) => {
    // Always return 200 — Razorpay retries on non-200
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = req.body; // Buffer

      // Step 1 — Verify webhook signature
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSig !== signature) {
        console.warn('Webhook: invalid signature');
        logPayment({ user_id: 0, event: 'webhook_ignored', reason: 'Invalid signature' });
        return res.sendStatus(200);
      }

      let payload;
      try {
        payload = JSON.parse(rawBody.toString());
      } catch (_) {
        logPayment({ user_id: 0, event: 'webhook_ignored', reason: 'Malformed JSON' });
        return res.sendStatus(200);
      }

      // Step 2 — Only handle payment.captured
      if (payload.event !== 'payment.captured') {
        logPayment({ user_id: 0, event: 'webhook_ignored', reason: `Unhandled event: ${payload.event}` });
        return res.sendStatus(200);
      }

      const entity = payload.payload?.payment?.entity;
      if (!entity) {
        logPayment({ user_id: 0, event: 'webhook_ignored', reason: 'Missing payment entity' });
        return res.sendStatus(200);
      }

      // Step 3 — Validate amount & currency
      if (entity.amount !== AMOUNT || entity.currency !== CURRENCY) {
        logPayment({ user_id: 0, order_id: entity.order_id, payment_id: entity.id, event: 'webhook_ignored', reason: `Amount/currency mismatch: ${entity.amount} ${entity.currency}` });
        return res.sendStatus(200);
      }

      // Step 4 — Look up user by pending_order_id (NOT receipt)
      const user = db.prepare('SELECT id FROM users WHERE pending_order_id = ?').get(entity.order_id);
      if (!user) {
        logPayment({ user_id: 0, order_id: entity.order_id, payment_id: entity.id, event: 'webhook_ignored', reason: 'No user found for order' });
        return res.sendStatus(200);
      }

      // Step 5 — DB-level idempotent update
      try {
        const result = db.prepare(`
          UPDATE users
          SET registration_fee_paid = 1,
              razorpay_payment_id   = ?,
              pending_order_id      = '',
              pending_order_at      = 0
          WHERE id = ? AND registration_fee_paid = 0
        `).run(entity.id, user.id);

        if (result.changes === 0) {
          logPayment({ user_id: user.id, order_id: entity.order_id, payment_id: entity.id, event: 'webhook_ignored', reason: 'Already paid' });
        } else {
          logPayment({ user_id: user.id, order_id: entity.order_id, payment_id: entity.id, event: 'webhook_captured', status: 'ok' });
        }
      } catch (dbErr) {
        if (dbErr.message && dbErr.message.includes('UNIQUE constraint failed')) {
          logPayment({ user_id: user.id, payment_id: entity.id, event: 'duplicate_payment_detected', reason: dbErr.message });
        } else {
          console.error('Webhook DB error:', dbErr);
        }
      }

    } catch (err) {
      console.error('Webhook unexpected error:', err);
    }

    return res.sendStatus(200);
  }
);

module.exports = router;
