import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { supabase } from '../supabase';

export default function ProductModal({ isOpen, onClose, onProductSaved, productToEdit }) {
  const { session, showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '',
    price: '', unit: '', stock: '', emoji: '', desc: '', image_url: ''
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || '',
        price: productToEdit.smile_source_price || '',
        unit: productToEdit.unit || '',
        stock: productToEdit.quantity !== undefined ? productToEdit.quantity : '',
        emoji: productToEdit.emoji_icon || '',
        desc: productToEdit.description || '',
        image_url: productToEdit.image_url || ''
      });
    } else {
      setFormData({
        name: '', category: '',
        price: '', unit: '', stock: '', emoji: '', desc: '', image_url: ''
      });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          
          const res = await fetch('/.netlify/functions/api-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              fileName: fileName,
              mimeType: file.type
            })
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Upload failed');
          }

          const { url } = await res.json();
          setFormData(prev => ({ ...prev, image_url: url }));
          showToast("✅ Image uploaded!");
        } catch (error) {
          alert("Error uploading image: " + error.message);
        } finally {
          setUploadingImage(false);
          e.target.value = ''; // Reset input
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Error reading file: " + error.message);
      setUploadingImage(false);
      e.target.value = '';
    }
  };

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
        emoji_icon: formData.emoji || '📦',
        image_url: formData.image_url || null
      };

      if (productToEdit) {
        payload.id = productToEdit.id;
      }

      const res = await fetch('/.netlify/functions/api-products', {
        method: productToEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseBody = await res.json();
      
      if (!res.ok) throw new Error(responseBody.error || `Failed to ${productToEdit ? 'update' : 'add'} product`);
      
      showToast(`✅ "${formData.name}" ${productToEdit ? 'updated' : 'added'}!`);
      const updatedProduct = responseBody.data || { id: productToEdit?.id || 'temp', ...payload };
      onProductSaved(updatedProduct, !!productToEdit);
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
          <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
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
              <label>Image URL or Upload</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="url" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} style={{ flex: 1 }} />
                <div style={{ flexShrink: 0, padding: '0.5rem', background: '#f0f0f0', borderRadius: '4px', border: '1px solid #ccc' }}>
                   <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </div>
              </div>
              {uploadingImage && <small style={{ color: 'var(--primary)', marginTop: '0.2rem', display: 'block' }}>Uploading image...</small>}
            </div>
            
            <div className="form-group full">
              <label>Description</label>
              <textarea placeholder="Brief product description…" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn-submit" disabled={loading || uploadingImage}>
              {loading ? "Saving..." : (productToEdit ? "Save Changes" : "Add to Catalog →")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
