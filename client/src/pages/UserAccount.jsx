import React, { useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { LangContext, t } from '../lang';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export default function UserAccount() {
  const { user, updateUser } = useAuth();
  const { activityLang } = useContext(LangContext);
  const T = { ...t['en'], ...t[activityLang] };

  const missingPhone = !user?.phone;

  // Auto-open edit form if phone is missing
  const [editing, setEditing] = useState(missingPhone);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipcode: user?.zipcode || '',
  });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  function startEdit() {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipcode: user?.zipcode || '',
    });
    setSaveError('');
    setEditing(true);
  }

  function handlePhoneChange(e) {
    // Only allow digits, max 10
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setEditForm(f => ({ ...f, phone: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    if (editForm.phone && editForm.phone.length !== 10) {
      setSaveError('Phone number must be exactly 10 digits');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile(editForm);
      updateUser(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="page-container">
      <h1>Profile</h1>

      {missingPhone && (
        <div className="phone-required-banner">
          <div className="phone-required-title">{T.phoneRequiredTitle}</div>
          <div className="phone-required-msg">{T.phoneRequiredMsg}</div>
        </div>
      )}

      <div className="section-card">
        <div className="section-card-header">
          <h2>My Details</h2>
          {!editing && <button className="btn-edit" onClick={startEdit}>Edit</button>}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="profile-edit-form">
            {saveError && <div className="alert alert-error">{saveError}</div>}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Phone Number {missingPhone && <span className="required-star">*</span>}</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={handlePhoneChange}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                required={missingPhone}
              />
              {editForm.phone.length > 0 && editForm.phone.length < 10 && (
                <span className="field-hint">{editForm.phone.length}/10 digits</span>
              )}
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input type="text" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
            </div>
            <div className="form-group">
              <label>State</label>
              <select value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} className="form-select">
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input type="text" value={editForm.zipcode} onChange={e => setEditForm(f => ({ ...f, zipcode: e.target.value }))} placeholder="ZIP code" />
            </div>
            <div className="profile-edit-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              {!missingPhone && <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-row"><span className="detail-label">Name</span><span>{user?.name}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span>{user?.email}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span>{user?.phone || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Address</span><span>{user?.address || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">City</span><span>{user?.city || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">State</span><span>{user?.state || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">ZIP Code</span><span>{user?.zipcode || '—'}</span></div>
          </div>
        )}
      </div>

      {!missingPhone && (
        <div className="section-card">
          <div className="section-card-header">
            <h2>Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="profile-edit-form">
            {pwError && <div className="alert alert-error">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
            </div>
            <div className="profile-edit-actions">
              <button type="submit" className="btn-primary" disabled={pwSaving}>{pwSaving ? 'Saving…' : 'Update Password'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
