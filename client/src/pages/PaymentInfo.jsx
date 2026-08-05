import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { api } from '../api';
import { BRAND } from '../lang';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

function loadRazorpayScript(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    const timer = setTimeout(() => resolve(false), timeoutMs);
    script.onload = () => { clearTimeout(timer); resolve(true); };
    script.onerror = () => { clearTimeout(timer); resolve(false); };
    document.body.appendChild(script);
  });
}

export default function PaymentInfo() {
  const { user, login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState(''); // processing message
  const [error, setError] = useState('');
  const [verifyError, setVerifyError] = useState(null); // { message, paymentId }
  const [dismissedAfterFail, setDismissedAfterFail] = useState(false);

  const paymentFailedRef = useRef(false);
  const tokenRef = useRef(localStorage.getItem('token'));

  // On mount: refresh user state (webhook may have already marked fee paid)
  useEffect(() => {
    api.me().then(freshUser => {
      login(freshUser, tokenRef.current);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePayClick() {
    setError('');
    setVerifyError(null);
    setDismissedAfterFail(false);
    setLoading(true);
    paymentFailedRef.current = false;

    // Step 1: Create order
    let orderData;
    try {
      orderData = await api.createOrder();
    } catch (err) {
      setError(err.message || 'Failed to create payment order. Please try again.');
      setLoading(false);
      return;
    }

    // Step 2: Load Razorpay script (5s timeout)
    const scriptLoaded = await loadRazorpayScript(5000);
    if (!scriptLoaded) {
      setScriptFailed(true);
      setLoading(false);
      return;
    }

    // Step 3: Open checkout modal
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: BRAND.org,
      description: `Registration Fee ${BRAND.registrationFeeDisplay}`,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#6c63ff' },
      method: {
        card:         1,
        upi:          1,
        netbanking:   0,
        wallet:       0,
        emi:          0,
        paylater:     0,
        bank_transfer: 0,
      },
      handler: async function (response) {
        await doVerify(response, false);
      },
      modal: {
        ondismiss: function () {
          if (paymentFailedRef.current) {
            setDismissedAfterFail(true);
          }
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      paymentFailedRef.current = true;
    });
    rzp.open();
  }

  async function doVerify(response, isRetry) {
    try {
      setStatus('Verifying payment…');
      const result = await api.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (result.retryable && !isRetry) {
        // Payment authorized but not yet captured — retry once after 3s
        setStatus('Payment processing, please wait…');
        setTimeout(async () => {
          try {
            const retryResult = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!retryResult.retryable) {
              await refreshAndSucceed();
            } else {
              setStatus('');
              setVerifyError({
                message: 'Payment is still pending capture. Contact support.',
                paymentId: response.razorpay_payment_id,
              });
              setLoading(false);
            }
          } catch (retryErr) {
            setStatus('');
            setVerifyError({
              message: retryErr.message || 'Verification failed after retry.',
              paymentId: response.razorpay_payment_id,
            });
            setLoading(false);
          }
        }, 3000);
        return;
      }

      await refreshAndSucceed();
    } catch (err) {
      setStatus('');
      setVerifyError({
        message: err.message || 'Verification failed. Contact support.',
        paymentId: response.razorpay_payment_id,
      });
      setLoading(false);
    }
  }

  async function refreshAndSucceed() {
    try {
      const freshUser = await api.me();
      login(freshUser, tokenRef.current);
    } catch (_) {}
    setStatus('');
    setSuccess(true);
    setLoading(false);
  }

  const feePaid = user?.registration_fee_paid === 1 || success;

  return (
    <div className="page-container">
      <h1>Payment Info</h1>

      <div className="section-card">
        <h2>Competition Rules</h2>
        <ul style={{ lineHeight: '2', fontSize: '1.05rem' }}>
          <li>૦૧ એપ્રિલ ૨૦૨૬, બુધવાર → ૩૧ જુલાઈ ૨૦૨૬, શુક્રવાર</li>
          <li>Registration ફી {BRAND.registrationFeeDisplay}/-</li>
        </ul>
      </div>

      <div className="section-card">
        <div className="payment-qr-section" style={{ textAlign: 'center' }}>
          <p className="payment-qr-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Registration ફી {BRAND.registrationFeeDisplay}
          </p>

          {/* ── Already paid ── */}
          {feePaid && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              ✅ Registration fee paid. Your points are active!
              {user?.razorpay_payment_id && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', opacity: 0.7 }}>
                  Payment ID: {user.razorpay_payment_id}
                </div>
              )}
            </div>
          )}

          {/* ── UPI QR (always visible when not paid) ── */}
          {!feePaid && (
            <>
              <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                — or pay via UPI —
              </p>
              <img
                src="/payment-qr.png"
                alt="UPI Payment QR"
                className="payment-qr-img"
                style={{ maxWidth: 220, margin: '0 auto', display: 'block' }}
              />
              <p className="payment-upi-id" style={{ marginTop: '0.75rem' }}>
                UPI ID: <strong>devisinghbca96@oksbi</strong>
              </p>
              <div className="payment-warning" style={{ marginTop: '1rem' }}>
                ⚠️ જો {BRAND.registrationFeeDisplay} ફી ભરવામાં નહીં આવે, તો activity points ગણવામાં આવશે નહીં.<br />
                <span>If {BRAND.registrationFeeDisplay} registration fee is not paid, activity points will not be counted.</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.75rem' }}>
                
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
