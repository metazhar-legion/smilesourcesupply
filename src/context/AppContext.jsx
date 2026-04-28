import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track the authentication session state globally
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
           showToast("No more stock available");
           return prev;
        }
        showToast(`🛒 ${product.name} added to cart!`);
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      showToast(`🛒 ${product.name} added to cart!`);
      return [...prev, { 
        id: product.id, 
        product_id: product.id,
        product_name: product.name, 
        unit_price: product.smile_source_price, 
        emoji: product.emoji_icon || '📦',
        quantity: 1 
      }];
    });
  };

  const changeQuantity = (id, delta) => {
    setCart(prev => prev.map(p => {
        if (p.id === id) return { ...p, quantity: p.quantity + delta };
        return p;
    }).filter(p => p.quantity > 0));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      isAdmin, session,
      cart, addToCart, changeQuantity, clearCart,
      toastMsg, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};
