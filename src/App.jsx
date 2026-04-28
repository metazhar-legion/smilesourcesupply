import { Routes, Route } from 'react-router-dom';
import { Topbar, Header } from './components/Layout';
import Catalog from './pages/Catalog';
import Wholesale from './pages/Wholesale';
import About from './pages/About';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import LoginModal from './components/LoginModal';
import { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toastMsg } = useContext(AppContext);

  return (
    <>
      <Topbar />
      <Header onOpenCart={() => setIsCartOpen(true)} onOpenLogin={() => setIsLoginOpen(true)} />
      
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/wholesale" element={<Wholesale />} />
        <Route path="/about" element={<About />} />
      </Routes>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
        }}
      />
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
      <div className={`toast ${toastMsg ? 'show green' : ''}`} style={{ zIndex: 9999 }}>
        {toastMsg}
      </div>
    </>
  );
}

export default App;
