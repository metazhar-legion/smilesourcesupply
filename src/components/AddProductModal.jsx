import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const { session, showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '',
    price: '', unit: '', stock: '', emoji: '', desc: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        smile_source_price: parseFloat(formData.price),
        quantity: parseInt(formData.stock),
        category: formData.category,
        description: formData.desc,
        emoji_icon: formData.emoji || '📦'
      };

      const res = await fetch('/.netlify/functions/api-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (!res.ok) throw new Error(responseBody.error || "Failed to add product");
      
      showToast(`✅ "${formData.name}" added to catalog!`);
      // Re-trigger product rendering with real appended row
      onProductAdded({id: responseBody.data?.id || 'temp', ...payload});
      onClose();
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="overlay open" onClick={onClose} style={{ zIndex: 650 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input required type="text" placeholder="CaviWipes XL" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="">Select…</option>
                  <option>Disinfection</option>
                  <option>Gloves & PPE</option>
                  <option>Instruments</option>
                  <option>Disposables</option>
                  <option>Sterilization</option>
                  <option>Prophylaxis</option>
                  <option>Barriers</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (USD) *</label>
                <input required type="number" min="0" step="0.01" placeholder="45.99" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Unit Label</label>
                <input type="text" placeholder="/case of 160" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Stock Qty *</label>
                <input required type="number" min="0" placeholder="250" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Emoji Icon</label>
                <input type="text" placeholder="🧻" maxLength="4" value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              </div>
            </div>
            
            <div className="form-group full">
              <label>Description</label>
              <textarea placeholder="Brief product description…" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add to Catalog →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
