import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function ProductCard({ p, onRemove }) {
  const { isAdmin, addToCart } = useContext(AppContext);

  const stockClass = p.quantity === 0 ? 'stock-out' : p.quantity < 50 ? 'stock-low' : 'stock-ok';
  const stockLabel = p.quantity === 0 ? 'Out of Stock' : p.quantity < 50 ? `Low: ${p.quantity}` : `In Stock: ${p.quantity}`;
  const badge = p.quantity === 0 ? <span className="product-badge badge-out">Out of Stock</span>
              : p.quantity < 50 ? <span className="product-badge badge-low">Low Stock</span> : null;

  return (
    <div className="product-card">
      <div className="product-thumb">
        {badge}
        {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="product-image" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        ) : (
            p.emoji_icon || '📦'
        )}
      </div>
      <div className="product-body">
        <div className="product-cat">{p.category || 'General'}</div>
        <div className="product-name">{p.name}</div>
        <div className="product-sku">SKU: {p.id.substring(0, 8)}</div>
        <div className="product-desc">{p.description || ''}</div>
        <div className="product-meta">
          <div>
            <div className="product-price">${parseFloat(p.smile_source_price || 0).toFixed(2)}</div>
          </div>
          <span className={`product-stock ${stockClass}`}>{stockLabel}</span>
        </div>
        <div className="product-actions">
          <button className="btn-buy" onClick={() => addToCart(p)} disabled={p.quantity === 0}>🛒 Buy</button>
          {isAdmin && (
            <button className="btn-remove" onClick={() => onRemove(p.id)} title="Remove">🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}
