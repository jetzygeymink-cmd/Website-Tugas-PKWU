import React, { useState, useMemo } from 'react';
import { PRODUCTS } from './constants';
import { CartItem, Product, Order } from './types';
import { formatCurrency, cn } from './lib/utils';
import { ShoppingCart, ShoppingBag, Plus, Minus, X, Phone, User, Send, ChevronRight, Menu, Soup, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    note: '',
  });

  const categories = useMemo(() => ['Semua', ...Array.from(new Set(PRODUCTS.map(p => p.category)))], []);

  const filteredProducts = useMemo(() => 
    activeCategory === 'Semua' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory),
    [activeCategory]
  );

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          phoneNumber: formData.phone,
          note: formData.note,
          items: cart,
          totalPrice,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        setOrderSuccess(order);
        setCart([]);
        setIsCartOpen(false);
        setFormData({ name: '', phone: '', note: '' });
      }
    } catch (err) {
      alert("Gagal mengirim pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app font-sans text-text-main overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b-2 border-primary px-6 md:px-10 h-[80px] flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tighter text-text-main">
              Tokoo<span className="bg-primary px-2 py-1 rounded-md mx-1">Piaow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Hubungi Kami</span>
              <a href="https://wa.me/6281459072472" target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-1.2">
                <Phone size={14} className="text-primary" />
                0814-5907-2472
              </a>
            </div>
            <div className="hidden md:flex bg-[#E3FCEF] text-[#006644] px-3 py-1 rounded-full text-xs font-semibold">
              Restoran Buka • Pengiriman 15-20 mnt
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-bg-app transition-all group"
            >
              <ShoppingCart className="w-5 h-5 text-text-main" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-text-main text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Menu Section */}
        <section className="menu-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Menu size={20} className="text-primary" />
              Pilih Menu Favoritmu
            </h2>
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-border-main overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                    activeCategory === cat 
                      ? "bg-primary text-text-main" 
                      : "text-text-light hover:bg-bg-app"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                className="bg-card rounded-2xl p-4 flex gap-4 border border-border-main transition-transform active:scale-95 cursor-default group"
              >
                <div className="w-24 h-24 bg-bg-app rounded-xl overflow-hidden shrink-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-base mb-1">{product.name}</h3>
                  <p className="text-text-light text-xs mb-3 line-clamp-2">{product.description}</p>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-bold text-sm">{formatCurrency(product.price)}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-primary/10 text-text-main p-1.5 rounded-lg hover:bg-primary transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Order Panel (Right Side on Desktop, Hidden on Mobile until Drawer) */}
        <aside className="hidden lg:flex flex-col bg-card rounded-[24px] p-6 border border-border-main shadow-[0_10px_30px_rgba(0,0,0,0.05)] sticky top-[120px] h-fit">
          <h2 className="text-xl font-bold mb-6 pb-4 border-b border-border-main">Formulir Pesanan</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="text-[12px] font-bold text-text-light uppercase mb-1.5 block">Nama Lengkap</label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F9FAFB] border-[1.5px] border-border-main rounded-xl text-sm outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="form-group">
              <label className="text-[12px] font-bold text-text-light uppercase mb-1.5 block">Nomor HP / WhatsApp</label>
              <input 
                type="tel" 
                required
                placeholder="0812-xxxx-xxxx"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#F9FAFB] border-[1.5px] border-border-main rounded-xl text-sm outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="form-group">
              <label className="text-[12px] font-bold text-text-light uppercase mb-1.5 block">Catatan Pesanan</label>
              <textarea 
                placeholder="Contoh: Nasi gorengnya pedas ya..."
                value={formData.note}
                onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full h-20 px-3 py-2.5 bg-[#F9FAFB] border-[1.5px] border-border-main rounded-xl text-sm outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="cart-summary mt-6 pt-4 border-t border-dashed border-border-main space-y-2">
              <div className="flex justify-between text-sm text-text-light">
                <span>Subtotal ({totalItems} Item)</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-light">
                <span>Pajak (0%)</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between font-extrabold text-lg text-text-main pt-2">
                <span>Total Bayar</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-primary text-text-main py-4 rounded-xl font-bold mt-4 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? "Mengirim..." : (cart.length === 0 ? "Pilih Menu Terlebih Dahulu" : "Kirim Pesanan Sekarang")}
            </button>
          </form>
        </aside>
      </main>

      {/* Cart Button Mobile Overlay */}
      <div className="lg:hidden fixed bottom-6 left-0 right-0 px-6 z-40">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-primary text-text-main py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-text-main text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
          </div>
          Lihat Keranjang • {formatCurrency(totalPrice)}
        </button>
      </div>

      {/* Cart Drawer (Mobile & Shared Logic) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-text-main/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-card z-[101] shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-border-main">
                <h2 className="text-xl font-bold">Pesanan Anda</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-bg-app rounded-lg"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingBag size={48} className="mb-4" />
                    <p className="font-bold">Keranjang Kosong</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-bg-app rounded-xl overflow-hidden shrink-0 border border-border-main">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                          <span className="text-sm font-bold">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md border border-border-main flex items-center justify-center hover:bg-bg-app"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-md border border-border-main flex items-center justify-center hover:bg-bg-app"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Form inside Drawer for Mobile */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-border-main bg-[#F9FAFB] lg:hidden">
                   <div className="space-y-4 mb-6">
                      <div className="form-group">
                        <label className="text-[10px] font-bold text-text-light uppercase mb-1 block">Nama Lengkap</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Nama Lengkap"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-card border border-border-main rounded-xl text-sm"
                        />
                      </div>
                      <div className="form-group">
                        <label className="text-[10px] font-bold text-text-light uppercase mb-1 block">No. WhatsApp</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="No. WhatsApp"
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-card border border-border-main rounded-xl text-sm"
                        />
                      </div>
                   </div>
                   <div className="flex justify-between items-center font-bold mb-4">
                      <span>Total Bayar</span>
                      <span className="text-xl">{formatCurrency(totalPrice)}</span>
                   </div>
                   <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-text-main py-4 rounded-xl font-bold shadow-lg"
                   >
                     {isSubmitting ? "Mengirim..." : "Konfirmasi Pesanan"}
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[200]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-text-main/80 backdrop-blur-sm" onClick={() => setOrderSuccess(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="bg-[#E3FCEF] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-[#006644] w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Pesanan Berhasil!</h2>
              <p className="text-text-light text-sm mb-6">Pesanan Anda <span className="text-text-main font-bold">#{orderSuccess.id.toUpperCase()}</span> sedang diproses.</p>
              <div className="flex flex-col gap-2">
                <a 
                  href={`https://wa.me/6281459072472?text=Halo%20Tokoo%20Piaow,%20saya%20ingin%20konfirmasi%20pesanan%20%23${orderSuccess.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <MessageCircle size={18} />
                  Hubungi via WhatsApp
                </a>
                <button onClick={() => setOrderSuccess(null)} className="w-full bg-primary py-3 rounded-xl font-bold text-text-main">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-card border-t border-border-main py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-extrabold text-xl tracking-tighter">Tokoo<span className="bg-primary px-2 py-0.5 rounded-sm mx-1">Piaow</span></span>
            <div className="flex items-center gap-2 text-text-light text-sm font-medium">
              <Phone size={14} className="text-primary" />
              <span>+62 814-5907-2472</span>
            </div>
          </div>
          <p className="text-text-light text-xs font-semibold uppercase tracking-widest">© 2026 TOKOO PIAOW. SEMUA HAK DILINDUNGI.</p>
        </div>
      </footer>
    </div>
  );
}
