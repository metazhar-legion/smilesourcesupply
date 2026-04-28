import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

export default function Catalog() {
  const { isAdmin, session, showToast } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetch('/.netlify/functions/api-products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/.netlify/functions/api-products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!res.ok) {
         const d = await res.json();
         throw new Error(d.error || 'Delete failed');
      }
      setProducts(products.filter(p => p.id !== id));
      showToast("🗑 Product deleted successfully!");
    } catch(e) {
      alert(e.message);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category || 'General'))].sort();

  const filtered = products.filter(p => {
    const rawCat = p.category || 'General';
    const matchCat = activeFilter === 'All' || rawCat === activeFilter;
    const matchQ = !search || [p.name, rawCat, p.description].some(s => s && s.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchQ;
  });

  return (
    <div className="page active">
      <div className="products-hero">
        <div className="hero-content">
          <h1>Dental Supplies at <span>Wholesale Prices</span></h1>
          <p>Real-time inventory · Bulk pricing · Fast shipping to your practice</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">{products.length}</div>
              <div className="hero-stat-lbl">Products</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">{categories.length - 1}</div>
              <div className="hero-stat-lbl">Categories</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">48hr</div>
              <div className="hero-stat-lbl">Avg Ship Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search products, SKUs, brands…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {categories.map(c => (
            <button key={c} className={`filter-tab ${c === activeFilter ? 'active' : ''}`} onClick={() => setActiveFilter(c)}>{c}</button>
          ))}
        </div>
        {isAdmin && (
          <button className="add-product-btn" onClick={() => setIsAddOpen(true)}>
            ＋ Add Product
          </button>
        )}
      </div>

      <div className="products-container">
        <div className="results-bar">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong> products</span>
          <span style={{ fontSize: '0.78rem' }}>Prices shown per unit/case</span>
        </div>
        
        {loading ? (
             <div className="empty-state" style={{ gridColumn: '1/-1' }}>
               <h3>Loading Catalog...</h3>
             </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div>🔍</div>
            <h3>No products found</h3>
            <p>Try a different search or category filter</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(p => <ProductCard key={p.id} p={p} onRemove={handleRemove} onEdit={() => setEditingProduct(p)} />)}
          </div>
        )}
      </div>

      <ProductModal 
         isOpen={isAddOpen || !!editingProduct} 
         onClose={() => { setIsAddOpen(false); setEditingProduct(null); }} 
         productToEdit={editingProduct}
         onProductSaved={(savedProd, isEdit) => {
           if (isEdit) {
             setProducts(products.map(p => p.id === savedProd.id ? { ...p, ...savedProd } : p));
           } else {
             setProducts([savedProd, ...products]);
           }
         }} 
      />
    </div>
  );
}
