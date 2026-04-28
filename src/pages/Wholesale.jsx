import React, { useState } from 'react';

export default function Wholesale() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    practiceName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const res = await fetch('/.netlify/functions/api-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          practice_name: formData.practiceName,
          phone: formData.phone,
          message: formData.message
        })
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('Success! Application submitted.');
      setFormData({ firstName: '', lastName: '', practiceName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('Error: Could not submit application');
    }
  };

  return (
    <div className="page active">
      <div className="wholesale-page">
        <h1>Wholesale Account Application</h1>
        <p className="sub">Apply to access bulk pricing, net terms, and exclusive distributor agreements. We respond within 1 business day.</p>
        
        <form className="wform" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Jane" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Practice / Business Name</label>
              <input required type="text" value={formData.practiceName} onChange={e => setFormData({...formData, practiceName: e.target.value})} placeholder="Acme Dental Mfg Co." />
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@company.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full">
              <label>Phone (Optional)</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
            </div>
          </div>
          <div className="form-group">
            <label>Products / Categories of Interest</label>
            <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Describe the dental products or categories you're looking to source or supply…"></textarea>
          </div>
          <button type="submit" className="btn-submit">
            {status || 'Submit Application →'}
          </button>
        </form>
      </div>
    </div>
  );
}
