"use client";

import React, { useEffect, useState } from 'react';
import { Layers, Home, Clock, CheckCircle, Package, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { playPopSound } from '@/lib/sounds';

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fetch initial orders
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });
        
      if (data && !error) {
        // Only update if there's an actual change to prevent UI flickering
        setOrders(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
          return prev;
        });
      }
    };
    fetchOrders();

    // Hidden background refresh every 3 seconds
    const intervalId = setInterval(fetchOrders, 3000);

    // Subscribe to realtime updates
    const sub = supabase.channel('kitchen_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (['pending', 'preparing'].includes(payload.new.status)) {
            setOrders(prev => [...prev, payload.new]);
            playPopSound(); // sound alert for new order
          }
        } else if (payload.eventType === 'UPDATE') {
          if (['pending', 'preparing'].includes(payload.new.status)) {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          } else {
            // Remove from list if status is ready or cancelled
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
            if (selectedOrder?.id === payload.new.id) {
              setSelectedOrder(null);
            }
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(sub);
    };
  }, [selectedOrder]);

  const markAsReady = async (id: string) => {
    const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedOrder(null);
    } else {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col md:flex-row gap-6 font-cairo" dir="rtl">
      {/* Sidebar / List */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-zinc-900 border border-white/10 rounded-3xl p-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0"
            title="العودة للصفحة الرئيسية"
          >
            <Home size={20} />
          </button>
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
            <Layers size={20} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-black">المطبخ</h1>
            <p className="text-white/50 text-xs">{orders.length} طلبات قيد الانتظار</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence>
            {orders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/40 mt-10 text-sm">
                لا توجد طلبات حالياً
              </motion.div>
            )}
            {orders.map(order => (
              <motion.button
                key={order.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-right p-4 rounded-2xl border transition-all ${
                  selectedOrder?.id === order.id 
                    ? 'bg-orange-500/10 border-orange-500' 
                    : 'bg-black/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold font-mono">#{String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase()}</span>
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  {order.order_type === 'pickup' ? <Store size={14} className="text-pink-400" /> : <Package size={14} className="text-blue-400" />}
                  <span>{order.order_type === 'pickup' ? 'استلام' : 'توصيل'} - {order.customer_name}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Area / Details */}
      <div className="flex-1 bg-zinc-900 border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden">
        {selectedOrder ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                  طلب #{String(selectedOrder.id).includes('-') ? String(selectedOrder.id).split('-')[0].toUpperCase() : String(selectedOrder.id).toUpperCase()}
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    selectedOrder.order_type === 'pickup' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedOrder.order_type === 'pickup' ? 'استلام من المحل' : 'توصيل للسائق'}
                  </span>
                </h2>
                <div className="text-white/60 text-sm space-y-1">
                  <p>العميل: <strong className="text-white">{selectedOrder.customer_name}</strong> ({selectedOrder.customer_phone})</p>
                  {selectedOrder.order_type === 'delivery' && <p>العنوان: {selectedOrder.customer_address}</p>}
                </div>
              </div>
              
              <div className="text-center bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                <p className="text-white/40 text-xs mb-1">وقت الطلب</p>
                <p className="font-bold text-xl">{new Date(selectedOrder.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              <h3 className="text-lg font-bold text-white/80 mb-4">الأصناف المطلوبة</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">{item.name}</h4>
                      {item.sauces && item.sauces.length > 0 && (
                        <p className="text-sm text-white/50 mt-1">الإضافات: {item.sauces.join('، ')}</p>
                      )}
                    </div>
                    <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl">
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div className="mt-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-orange-400">
                  <h4 className="font-bold text-sm mb-1">ملاحظات العميل:</h4>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => markAsReady(selectedOrder.id)}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <CheckCircle size={28} />
              تم تجهيز الطلب ✔️
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
            <Layers size={64} />
            <p className="text-xl font-bold">اختر طلباً من القائمة لعرض تفاصيله</p>
          </div>
        )}
      </div>
    </div>
  );
}
