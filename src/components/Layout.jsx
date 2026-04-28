import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase } from '../supabase';

export const Topbar = () => (
  <div className="topbar">
    <span>🇺🇸 Pennsylvania LLC &nbsp;·&nbsp; Wholesale Dental Supply</span>
    <span>📞 <a href="#">(215) 555-0100</a> &nbsp;·&nbsp; ✉️ <a href="#">orders@smilesource.com</a></span>
  </div>
);

export const Header = ({ onOpenCart, onOpenLogin }) => {
  const { isAdmin, cart } = useContext(AppContext);
  const location = useLocation();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAdminClick = async () => {
    if (isAdmin) {
      await supabase.auth.signOut();
    } else {
      onOpenLogin();
    }
  };

  return (
    <header>
      <Link className="logo" to="/">
        <div className="logo-mark">🦷</div>
        <div>
          <div className="logo-name">Smile Source</div>
          <div className="logo-tag">Dental Supply &nbsp;·&nbsp; Wholesale</div>
        </div>
      </Link>

      <nav className="header-nav">
        <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">Products</Link>
        <Link className={`nav-link ${location.pathname === '/wholesale' ? 'active' : ''}`} to="/wholesale">Wholesale</Link>
        <Link className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} to="/about">About</Link>
      </nav>

      <div className="header-actions">
        <button className={`admin-toggle ${isAdmin ? 'on' : ''}`} onClick={handleAdminClick}>
          <div className="toggle-dot"></div>
          <span>{isAdmin ? 'Admin ON' : 'Admin'}</span>
        </button>
        <button className="cart-btn" onClick={onOpenCart}>
          🛒 Cart <span className="cart-count">{cartCount}</span>
        </button>
      </div>
    </header>
  );
};
