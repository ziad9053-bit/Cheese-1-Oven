"use client";

import React, { useEffect, useState } from 'react';
import { Layers, Home, Clock, CheckCircle, Package, Store, ChefHat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { playPopSound } from '@/lib/sounds';

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fetch initial orders
  const fetchOrders = async () => {
    // Active orders
    const { data: active, error: activeErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });
      
    if (active && !activeErr) {
      setOrders(prev => JSON.stringify(prev) !== JSON.stringify(active) ? active : prev);
    }

    // Completed orders (last 20)
    const { data: completed, error: completedErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['ready', 'out_for_delivery', 'delivered'])
      .order('updated_at', { ascending: false })
      .limit(20);

    if (completed && !completedErr) {
      setCompletedOrders(prev => JSON.stringify(prev) !== JSON.stringify(completed) ? completed : prev);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Hidden background refresh every 3 seconds
    const intervalId = setInterval(fetchOrders, 3000);

    // Subscribe to realtime updates
    const sub = supabase.channel('kitchen_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchOrders(); // Just re-fetch everything for simplicity since it's cached/optimized above
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            playPopSound(); // sound alert for new order
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(sub);
    };
  }, []);

  // Update selectedOrder automatically if it gets updated in the background
  useEffect(() => {
    if (selectedOrder) {
      const updated = [...orders, ...completedOrders].find(o => o.id === selectedOrder.id);
      if (updated && updated.status !== selectedOrder.status) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, completedOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchOrders();
    } else {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col md:flex-row gap-6 font-cairo" dir="rtl">
      {/* Sidebar / List */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
        
        {/* Active Orders Section */}
        <div className="flex-1 flex flex-col bg-zinc-900 border border-white/10 rounded-3xl p-4 overflow-hidden">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
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
              <p className="text-white/50 text-xs">{orders.length} طلبات نشطة</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <AnimatePresence>
              {orders.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/40 mt-10 text-sm">
                  لا توجد طلبات جديدة
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
                  className={`w-full text-right p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    selectedOrder?.id === order.id 
                      ? 'bg-orange-500/10 border-orange-500' 
                      : 'bg-black/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="font-bold font-mono">#{String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      order.status === 'pending' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {order.status === 'pending' ? 'طلب جديد 🔥' : 'قيد التجهيز 👨‍🍳'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70 relative z-10">
                    {order.order_type === 'pickup' ? <Store size={14} className="text-pink-400" /> : <Package size={14} className="text-blue-400" />}
                    <span>{order.order_type === 'pickup' ? 'استلام' : 'توصيل'} - {order.customer_name}</span>
                  </div>
                  
                  {order.status === 'pending' && (
                    <div className="absolute inset-0 bg-red-500/5 blur-xl pointer-events-none" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Orders Section */}
        <div className="h-[30%] flex flex-col bg-zinc-900 border border-white/10 rounded-3xl p-4 overflow-hidden">
          <div className="mb-4 pb-2 border-b border-white/10">
            <h2 className="text-white/50 text-sm font-bold">الطلبات المنجزة (للمراجعة)</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {completedOrders.length === 0 && (
              <div className="text-center text-white/20 text-xs mt-4">لا توجد طلبات منجزة بعد</div>
            )}
            {completedOrders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selectedOrder?.id === order.id ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-center opacity-50">
                  <span className="font-bold font-mono text-xs">#{String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase()}</span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </button>
            ))}
          </div>
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
                  
                  {/* Status Badge */}
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    selectedOrder.status === 'pending' ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : selectedOrder.status === 'preparing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {selectedOrder.status === 'pending' ? 'بانتظار البدء' 
                    : selectedOrder.status === 'preparing' ? 'قيد التجهيز الآن'
                    : 'منجز ✔️'}
                  </span>
                </h2>
                <div className="text-white/60 text-sm space-y-1 mt-4 bg-black/40 p-4 rounded-xl border border-white/5 inline-block min-w-[250px]">
                  <p>العميل: <strong className="text-white">{selectedOrder.customer_name}</strong></p>
                  <p>الجوال: <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-400 hover:underline">{selectedOrder.customer_phone}</a></p>
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
                <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400">
                  <h4 className="font-bold text-sm mb-1">ملاحظات العميل (هام):</h4>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons based on status */}
            {selectedOrder.status === 'pending' && (
              <button 
                onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <ChefHat size={28} />
                البدء بالتجهيز
              </button>
            )}
            
            {selectedOrder.status === 'preparing' && (
              <button 
                onClick={() => updateStatus(selectedOrder.id, 'ready')}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <CheckCircle size={28} />
                الانتهاء من التجهيز ✔️
              </button>
            )}

            {['ready', 'out_for_delivery', 'delivered'].includes(selectedOrder.status) && (
              <div className="w-full bg-black/40 text-white/40 font-bold text-lg py-6 rounded-2xl flex items-center justify-center gap-3 border border-white/5">
                <CheckCircle size={24} />
                تم التجهيز سابقاً
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
            <Layers size={64} />
            <p className="text-xl font-bold">اختر طلباً من القائمة لعرض تفاصيله والبدء به</p>
          </div>
        )}
      </div>
    </div>
  );
}
