import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Order } from './types';
import { formatCurrency, cn } from './lib/utils';
import { ShoppingBag, CheckCircle, Clock, XCircle, ChevronRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket: Socket = io();

    socket.on('new_order', (newOrder: Order) => {
      setOrders(prev => [newOrder, ...prev]);
      
      // Play notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Sound blocked by browser interaction policy'));

      if (Notification.permission === "granted") {
        new Notification("Pesanan Baru!", {
          body: `${newOrder.customerName} memesan ${newOrder.items.length} item.`,
        });
      }
    });

    socket.on('order_updated', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-[#FFF9DB] text-[#856404] border-[#FFE69C]';
      case 'preparing': return 'bg-[#E7F3FF] text-[#004085] border-[#B8DAFF]';
      case 'completed': return 'bg-[#E3FCEF] text-[#006644] border-[#B2F5D0]';
      case 'cancelled': return 'bg-[#FFE5E5] text-[#721C24] border-[#F5C6CB]';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'preparing': return 'Proses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Batal';
    }
  };

  return (
    <div className="min-h-screen bg-bg-app p-6 md:p-10 font-sans text-text-main">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Panel Pesanan</h1>
            <p className="text-text-light font-medium mt-1">Status dapur Anda saat ini secara langsung.</p>
          </div>
          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border-main shadow-sm">
            <div className="w-2.5 h-2.5 bg-[#006644] rounded-full animate-pulse" />
            <span className="text-xs font-bold text-text-main uppercase tracking-wider">Live Monitoring</span>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-[2rem] p-16 text-center border-2 border-dashed border-border-main">
            <ShoppingBag className="w-16 h-16 text-border-main mx-auto mb-4" />
            <h2 className="text-xl font-bold">Belum ada pesanan</h2>
            <p className="text-text-light mt-2">Daftar pesanan akan muncul di sini secara real-time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-[2rem] border border-border-main shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest", getStatusColor(order.status))}>
                        {getStatusLabel(order.status)}
                      </div>
                      <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-bold text-lg leading-tight">{order.customerName}</h3>
                      <a 
                        href={`https://wa.me/${order.phoneNumber.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-text-light text-xs font-bold flex items-center gap-1.5 mt-1 hover:text-primary transition-colors uppercase tracking-wider"
                      >
                        <MessageCircle size={14} />
                        {order.phoneNumber}
                      </a>
                    </div>

                    <div className="space-y-3 py-4 border-y border-border-main border-dashed">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-text-main font-bold">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-text-light font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 flex justify-between font-extrabold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>

                    {order.note && (
                      <div className="mt-4 p-3 bg-bg-app rounded-xl text-xs text-text-light italic">
                        "{order.note}"
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-[#F9FAFB] border-t border-border-main flex gap-2 mt-auto">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="flex-1 bg-primary text-text-main rounded-xl py-3 text-xs font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={16} />
                        Proses
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="flex-1 bg-[#E3FCEF] text-[#006644] rounded-xl py-3 text-xs font-bold hover:bg-[#B2F5D0] transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Selesai
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="p-3 bg-white text-text-light rounded-xl hover:text-rose-600 border border-border-main transition-all"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <div className="flex-1 text-center py-3 text-[#006644] font-bold text-xs bg-[#E3FCEF] rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest">
                        Pesanan Selesai
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

