"use client";

import React, { useEffect, useState } from 'react';
import { Home, Package, MapPin, Phone, CheckCircle, Navigation, Truck, Lock, ChefHat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { playPopSound } from '@/lib/sounds';

export default function DriverPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_type', 'delivery')
        .in('status', ['pending', 'preparing', 'ready', 'out_for_delivery'])
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

    const sub = supabase.channel('driver_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'order_type=eq.delivery' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (['pending', 'preparing', 'ready', 'out_for_delivery'].includes(payload.new.status)) {
            setOrders(prev => {
              const exists = prev.find(o => o.id === payload.new.id);
              
              if (!exists && payload.eventType === 'INSERT') {
                playPopSound(); // New order arrived
              } else if (exists && exists.status !== 'ready' && payload.new.status === 'ready') {
                playPopSound(); // Preparation finished
              }

              return exists 
                ? prev.map(o => o.id === payload.new.id ? payload.new : o)
                : [...prev, payload.new];
            });
          } else {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
            if (selectedOrder?.id === payload.new.id) setSelectedOrder(null);
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(sub);
    };
  }, [selectedOrder]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'delivered' && selectedOrder?.notes?.includes('[DOOR_PATH]')) {
      const match = selectedOrder.notes.match(/\[DOOR_PATH\](.*?)\[\/DOOR_PATH\]/);
      if (match && match[1]) {
        fetch('/api/delete-image', {
          method: 'POST',
          body: JSON.stringify({ path: match[1] }),
        }).catch(console.error);
      }
    }
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) alert('حدث خطأ أثناء تحديث حالة الطلب');
    if (newStatus === 'delivered' && selectedOrder?.id === id) {
      setTimeout(() => setSelectedOrder(null), 800);
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
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
            <Package size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-black">السائق</h1>
            <p className="text-white/50 text-xs">{orders.length} طلبات متاحة للتوصيل</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence>
            {orders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/40 mt-10 text-sm">
                لا توجد طلبات للتوصيل حالياً
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
                    ? 'bg-blue-500/10 border-blue-500' 
                    : 'bg-black/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold font-mono">#{String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-red-500/20 text-red-400' 
                    : order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400'
                    : order.status === 'ready' ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                  }`}>
                    {order.status === 'pending' ? 'بانتظار البدء' 
                    : order.status === 'preparing' ? 'قيد التجهيز'
                    : order.status === 'ready' ? 'جاهز (بانتظار المطبخ)'
                    : 'في الطريق إليك'}
                  </span>
                </div>
                {order.status === 'out_for_delivery' ? (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin size={14} className="text-blue-400 shrink-0" />
                    {order.customer_address.startsWith('http') ? (
                      <span className="text-blue-400">موقع ماب (اضغط للفتح من التفاصيل)</span>
                    ) : (
                      <span className="truncate">{order.customer_address}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Lock size={12} className="shrink-0" />
                    <span>العنوان محمي حالياً</span>
                  </div>
                )}

                {/* Quick Action Buttons for Mobile/Fast workflow */}
                <div className="mt-3 flex gap-2">
                  {order.status === 'ready' && (
                    <div className="w-full bg-zinc-800/50 text-white/50 border border-white/5 rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-bold">
                      <ChefHat size={16} /> بانتظار تسليم المطبخ
                    </div>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-black border border-blue-500/30 rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-bold transition-all"
                    >
                      <Package size={16} /> فتح تفاصيل الطلب
                    </button>
                  )}
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
                <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
                  طلب #{String(selectedOrder.id).includes('-') ? String(selectedOrder.id).split('-')[0].toUpperCase() : String(selectedOrder.id).toUpperCase()}
                </h2>
                {selectedOrder.status === 'out_for_delivery' ? (
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-white/70" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50">اسم العميل ورقم الجوال</p>
                        <p className="font-bold text-lg">{selectedOrder.customer_name} - <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-400 hover:underline" onClick={e => e.stopPropagation()}>{selectedOrder.customer_phone}</a></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400/50">عنوان التوصيل</p>
                        {selectedOrder.customer_address.startsWith('http') ? (
                          <a 
                            href={selectedOrder.customer_address} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-blue-500 hover:bg-blue-400 text-black font-bold text-sm py-2 px-4 rounded-xl flex items-center gap-2 mt-2 transition-all active:scale-95 inline-flex"
                          >
                            <MapPin size={16} /> فتح العنوان على ماب
                          </a>
                        ) : (
                          <p className="font-bold text-lg">{selectedOrder.customer_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Lock size={16} /> 
                    تفاصيل العميل ستظهر بعد أن يسلمك المطبخ هذا الطلب
                  </div>
                )}
              </div>
              
              <div className="text-center bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex justify-between items-center w-full">
                <div>
                  <p className="text-white/40 text-xs mb-1 text-right">المبلغ المطلوب</p>
                  <p className="font-black text-3xl text-emerald-400">{selectedOrder.total_price} <span className="text-sm">ر.س</span></p>
                </div>
                {selectedOrder.notes && selectedOrder.notes.includes('[PAYMENT_METHOD]') && (
                  <div className={`px-4 py-2 rounded-xl border ${
                    selectedOrder.notes.match(/\[PAYMENT_METHOD\](.*?)\[\/PAYMENT_METHOD\]/)?.[1] === 'cash' 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    <p className="text-xs opacity-70 mb-0.5">طريقة الدفع</p>
                    <p className="font-bold text-sm">
                      {selectedOrder.notes.match(/\[PAYMENT_METHOD\](.*?)\[\/PAYMENT_METHOD\]/)?.[1] === 'cash' ? '💵 كاش' : '💳 صرافة'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 pr-2">
              <h3 className="text-lg font-bold text-white/80 mb-4">تفاصيل الطلب (للمراجعة)</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                    </div>
                    <div className="text-white/50 font-bold">
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div className="mt-6 space-y-4">
                  {selectedOrder.notes.replace(/\[DOOR_IMAGE\].*?\[\/DOOR_IMAGE\]/g, '').replace(/\[DOOR_PATH\].*?\[\/DOOR_PATH\]/g, '').replace(/\[PAYMENT_METHOD\].*?\[\/PAYMENT_METHOD\]/g, '').trim() && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-orange-400">
                      <h4 className="font-bold text-sm mb-1">ملاحظات العميل:</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes.replace(/\[DOOR_IMAGE\].*?\[\/DOOR_IMAGE\]/g, '').replace(/\[DOOR_PATH\].*?\[\/DOOR_PATH\]/g, '').replace(/\[PAYMENT_METHOD\].*?\[\/PAYMENT_METHOD\]/g, '').trim()}</p>
                    </div>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && selectedOrder.notes.includes('[DOOR_IMAGE]') && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-white/80">
                        <Package size={16} /> صورة باب المنزل
                      </h4>
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={selectedOrder.notes.match(/\[DOOR_IMAGE\](.*?)\[\/DOOR_IMAGE\]/)?.[1] || ''} 
                          alt="صورة الباب" 
                          className="w-full h-auto object-cover max-h-[300px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {selectedOrder.status === 'ready' ? (
                <div className="flex-1 bg-zinc-800/50 text-white/50 font-bold text-lg py-6 rounded-2xl flex items-center justify-center gap-3 border border-white/5">
                  <ChefHat size={24} />
                  بانتظار تسليم المطبخ للطلب
                </div>
              ) : selectedOrder.status === 'out_for_delivery' ? (
                <button 
                  onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <CheckCircle size={28} />
                  تم تسليم الطلب للعميل ✔️
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 space-y-4">
            <Package size={64} />
            <p className="text-xl font-bold">اختر طلباً لعرض عنوان العميل وتفاصيل التوصيل</p>
          </div>
        )}
      </div>
    </div>
  );
}
