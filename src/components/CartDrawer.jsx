import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { cart, changeQuantity, clearCart } = useContext(AppContext);

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <>
      <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={onClose} style={{ background: 'rgba(0,0,0,0.3)', zIndex: 590 }}></div>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Your Order</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty"><div>🛒</div><p>Your cart is empty</p></div>
          ) : (
            cart.map(c => (
              <div className="cart-item" key={c.id}>
                <div className="cart-item-icon">{c.emoji}</div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{c.product_name}</div>
                  <div className="cart-item-price">${(c.unit_price * c.quantity).toFixed(2)}</div>
                </div>
                <div className="cart-qty">
                  <button className="qty-btn" onClick={() => changeQuantity(c.id, -1)}>−</button>
                  <span className="qty-num">{c.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQuantity(c.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Order Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="btn-checkout" onClick={onCheckout}>Place Order →</button>
            <button className="btn-clear-cart" onClick={clearCart}>Clear cart</button>
          </div>
        )}
      </div>
    </>
  );
}
