"use client";

import React, { useEffect, useState } from 'react';
import { Layers, Home, Clock, CheckCircle, Package, Store, ChefHat, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from "react-qr-code";
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
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true }); // Oldest first
      
    if (active && !activeErr) {
      // Sort pending above preparing, while keeping time order inside each group
      const sortedActive = active.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        if (a.status === 'preparing' && b.status === 'ready') return -1;
        if (a.status === 'ready' && b.status === 'preparing') return 1;
        return 0; 
      });
      setOrders(prev => JSON.stringify(prev) !== JSON.stringify(sortedActive) ? sortedActive : prev);
    }

    // Completed orders (last 20)
    const { data: completed, error: completedErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['delivered', 'out_for_delivery'])
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
    // Optimistic UI update so the button changes instantly!
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      
      if (newStatus === 'delivered' || newStatus === 'out_for_delivery') {
        setTimeout(() => setSelectedOrder(null), 800);
        
        // Check if there is a door image to delete (only if actually delivered to customer)
        if (newStatus === 'delivered' && selectedOrder.notes?.includes('[DOOR_PATH]')) {
          const match = selectedOrder.notes.match(/\[DOOR_PATH\](.*?)\[\/DOOR_PATH\]/);
          if (match && match[1]) {
            fetch('/api/delete-image', {
              method: 'POST',
              body: JSON.stringify({ path: match[1] }),
            }).catch(console.error);
          }
        }
      }
    }

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchOrders();
    } else {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 flex flex-col md:flex-row gap-6 font-cairo" dir="rtl">
      
      {/* Sidebar / List - Hidden on mobile if an order is selected */}
      <div className={`w-full md:w-1/3 lg:w-1/4 flex-col gap-6 ${selectedOrder ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Active Orders Section */}
        <div className="flex flex-col bg-zinc-900 border border-white/10 rounded-3xl p-4 md:flex-1 md:overflow-hidden md:h-auto min-h-[400px]">
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

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
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
                      order.status === 'pending' ? 'bg-red-500/20 text-red-400 animate-pulse' : 
                      order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status === 'pending' ? 'طلب جديد 🔥' : 
                       order.status === 'preparing' ? 'قيد التجهيز 👨‍🍳' :
                       'بانتظار التسليم 📦'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70 relative z-10">
                    {order.order_type === 'pickup' ? <Store size={14} className="text-pink-400" /> : <Package size={14} className="text-blue-400" />}
                    <span>{order.order_type === 'pickup' ? 'استلام' : 'توصيل'} - {order.customer_name}</span>
                  </div>
                  
                  {/* Time label */}
                  <div className="text-xs text-white/40 mt-3 flex items-center gap-1">
                    <Clock size={12} />
                    تم الطلب: {new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}
                  </div>
                  
                  {order.status === 'pending' && (
                    <div className="absolute inset-0 bg-red-500/5 blur-xl pointer-events-none" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>



        {/* Completed Orders Section (Delivered) */}
        <div className="flex flex-col bg-zinc-900 border border-white/10 rounded-3xl p-4 md:h-[20%] min-h-[120px] md:overflow-hidden">
          <div className="mb-4 pb-2 border-b border-white/10">
            <h2 className="text-green-500/70 text-sm font-bold flex items-center gap-2">
              <CheckCircle size={14} /> طلبات مكتملة ومسلمة
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {completedOrders.length === 0 && (
              <div className="text-center text-white/20 text-xs mt-4">لا توجد طلبات مسلمة بعد</div>
            )}
            {completedOrders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selectedOrder?.id === order.id ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-center opacity-60">
                  <span className="font-bold font-mono text-xs">#{String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase()}</span>
                  <CheckCircle size={14} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Area / Details - Hidden on mobile if NO order is selected */}
      <div className={`w-full md:flex-1 bg-zinc-900 border border-white/10 rounded-3xl p-4 md:p-6 flex-col relative ${!selectedOrder ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Mobile Back Button */}
        {selectedOrder && (
          <button 
            onClick={() => setSelectedOrder(null)}
            className="md:hidden flex items-center gap-2 text-white/70 bg-white/5 hover:bg-white/10 p-3 rounded-xl mb-4 transition-all w-fit shrink-0"
          >
            <ArrowRight size={18} />
            العودة للقائمة
          </button>
        )}

        {selectedOrder ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-6 border-b border-white/10 gap-4 shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-black mb-2 flex flex-wrap items-center gap-2 md:gap-3">
                  طلب #{String(selectedOrder.id).includes('-') ? String(selectedOrder.id).split('-')[0].toUpperCase() : String(selectedOrder.id).toUpperCase()}
                  <span className={`text-xs px-3 py-1 rounded-full border hidden md:inline-block ${
                    selectedOrder.order_type === 'pickup' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedOrder.order_type === 'pickup' ? 'استلام من المحل' : 'توصيل للسائق'}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`text-xs px-3 py-1 rounded-full border hidden md:inline-block ${
                    selectedOrder.status === 'pending' ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : selectedOrder.status === 'preparing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : selectedOrder.status === 'ready' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {selectedOrder.status === 'pending' ? 'بانتظار البدء' 
                    : selectedOrder.status === 'preparing' ? 'قيد التجهيز الآن'
                    : selectedOrder.status === 'ready' ? 'بانتظار التسليم 📦'
                    : 'مكتمل ومسلم ✔️'}
                  </span>
                </h2>
                
                {/* Mobile Badges */}
                <div className="flex md:hidden flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    selectedOrder.order_type === 'pickup' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedOrder.order_type === 'pickup' ? 'استلام من المحل' : 'توصيل للسائق'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    selectedOrder.status === 'pending' ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : selectedOrder.status === 'preparing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : selectedOrder.status === 'ready' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {selectedOrder.status === 'pending' ? 'بانتظار البدء' 
                    : selectedOrder.status === 'preparing' ? 'قيد التجهيز الآن'
                    : selectedOrder.status === 'ready' ? 'بانتظار التسليم 📦'
                    : 'مكتمل ومسلم ✔️'}
                  </span>
                </div>

                {selectedOrder.order_type === 'pickup' && (
                  <div className="text-white/60 text-sm space-y-1 mt-2 md:mt-4 bg-black/40 p-4 rounded-xl border border-white/5 inline-block w-full md:min-w-[250px]">
                    <p>العميل: <strong className="text-white">{selectedOrder.customer_name}</strong></p>
                    <p>الجوال: <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-400 hover:underline">{selectedOrder.customer_phone}</a></p>
                  </div>
                )}
              </div>
              
              <div className="text-center bg-black/40 px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto shrink-0">
                <p className="text-white/40 text-xs mb-1">وقت الطلب</p>
                <p className="font-bold text-xl">{new Date(selectedOrder.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}</p>
              </div>
            </div>

            <div className="flex-1 mb-4">
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
                    <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shrink-0 ml-2">
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div className="mt-6 space-y-4">
                  {selectedOrder.notes.replace(/\[DOOR_IMAGE\].*?\[\/DOOR_IMAGE\]/g, '').replace(/\[DOOR_PATH\].*?\[\/DOOR_PATH\]/g, '').trim() && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400">
                      <h4 className="font-bold text-sm mb-1">ملاحظات العميل (هام):</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes.replace(/\[DOOR_IMAGE\].*?\[\/DOOR_IMAGE\]/g, '').replace(/\[DOOR_PATH\].*?\[\/DOOR_PATH\]/g, '').trim()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons based on status */}
            <div className="sticky bottom-0 z-50 shrink-0 pt-4 pb-4 border-t border-white/10 mt-2 bg-zinc-900 w-full">
              
              {/* 1. حالة البدء بالتجهيز */}
              {selectedOrder.status === 'pending' && (
                <button 
                  onClick={() => updateStatus(selectedOrder.id, 'preparing')}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-xl py-4 md:py-6 rounded-2xl flex items-center justify-center gap-3"
                >
                  <ChefHat size={28} /> البدء بالتجهيز
                </button>
              )}
              
              {/* 2. حالة الانتهاء من التجهيز - تفرقة بين النوعين */}
              {selectedOrder.status === 'preparing' && (
                <button 
                  onClick={() => updateStatus(selectedOrder.id, 'ready')}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl py-4 md:py-6 rounded-2xl flex items-center justify-center gap-3"
                >
                  <CheckCircle size={28} /> 
                  {selectedOrder.order_type === 'pickup' ? 'تم التجهيز (بانتظار الزبون)' : 'تم التجهيز (بانتظار السائق)'}
                </button>
              )}

              {/* 3. حالة الطلب الجاهز - تسليم للزبون مباشرة */}
              {selectedOrder.status === 'ready' && selectedOrder.order_type === 'pickup' && (
                <button 
                  onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-black font-black text-xl py-4 md:py-6 rounded-2xl flex items-center justify-center gap-3"
                >
                  <Package size={28} /> تم تسليم الطلب للزبون 🤝
                </button>
              )}

              {/* 4. حالة الطلب الجاهز - تسليم للسائق */}
              {selectedOrder.status === 'ready' && selectedOrder.order_type === 'delivery' && (
                <button 
                  onClick={() => updateStatus(selectedOrder.id, 'out_for_delivery')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-4 md:py-6 rounded-2xl flex items-center justify-center gap-3"
                >
                  <Truck size={28} /> تم تسليم الطلب للسائق 🛵
                </button>
              )}

              {/* 5. حالة الطلب المسلم سابقاً */}
              {['out_for_delivery', 'delivered'].includes(selectedOrder.status) && (
                <div className="w-full bg-green-500/20 text-green-500 font-bold text-lg py-4 md:py-6 rounded-2xl flex items-center justify-center gap-3 border border-green-500/20">
                  <CheckCircle size={24} /> الطلب خرج من المطبخ بنجاح
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
            <Layers size={64} />
            <p className="text-xl font-bold text-center">اختر طلباً من القائمة<br/>لعرض تفاصيله والبدء به</p>
          </div>
        )}
      </div>
    </div>
  );
}
