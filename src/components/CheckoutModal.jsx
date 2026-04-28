import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, clearCart } = useContext(AppContext);
  const [formData, setFormData] = useState({ name: '', email: '', practice: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Name and Email are required!");
      return;
    }
    setLoading(true);
    const total_amount = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    try {
      const res = await fetch('/.netlify/functions/api-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          practice_name: formData.practice,
          total_amount,
          cart_items: cart
        })
      });
      if (!res.ok) throw new Error("Checkout failed");
      clearCart();
      setSuccess(true);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="overlay open" onClick={onClose} style={{ zIndex: 600 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Checkout Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h2>✅ Order Sent!</h2>
              <p>Our sales team will contact you shortly.</p>
              <button className="btn-submit" onClick={() => { setSuccess(false); onClose(); }}>Close</button>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: 15, fontSize: '0.9rem', color: 'var(--muted)' }}>
                Please provide your contact details to forward this order to our sales team.
              </p>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Practice Name</label>
                  <input type="text" placeholder="Dental Clinic" value={formData.practice} onChange={e => setFormData({...formData, practice: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="(555) 555-5555" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea placeholder="Any specific requests..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <button className="btn-submit" disabled={loading} onClick={handleSubmit}>
                {loading ? "Sending..." : "Submit Order →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
