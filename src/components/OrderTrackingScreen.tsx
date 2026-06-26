"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ShoppingBag, Truck, CheckCircle2, X, ChefHat, Bike, Star } from 'lucide-react';
import QRCode from "react-qr-code";

interface OrderTrackingScreenProps {
  orderId: string;
  onClose: () => void;
}

export function OrderTrackingScreen({ orderId, onClose }: OrderTrackingScreenProps) {
  const [status, setStatus] = useState<string>('pending');
  const [orderType, setOrderType] = useState<string>('pickup');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [origin, setOrigin] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    // Fetch google maps url
    supabase.from('products').select('description').eq('product_type', 'app_settings').eq('name', 'google_maps_url').single().then(({ data }) => {
      if (data && data.description) {
        setGoogleMapsUrl(data.description);
      }
    });

    const fetchStatus = async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (data) {
        setStatus(data.status);
        setOrderType(data.order_type);
        setOrderDetails(data);
      }
    };
    
    fetchStatus();

    const sub = supabase.channel(`order_tracking_${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setStatus(payload.new.status);
        setOrderDetails(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [orderId]);

  const qrValue = origin ? `${origin}/invoice/${orderId}` : `https://cheese1oven.com/invoice/${orderId}`;
  const shortId = String(orderId).includes('-') ? String(orderId).split('-')[0].toUpperCase() : String(orderId).toUpperCase();

  // Define Steps based on order type
  const steps = orderType === 'pickup' 
    ? [
        { id: 'preparing', label: 'قيد التجهيز', icon: Flame, match: ['pending', 'preparing'] },
        { id: 'ready', label: 'جاهز للاستلام', icon: ShoppingBag, match: ['ready'] },
        { id: 'delivered', label: 'تم الاستلام', icon: CheckCircle2, match: ['delivered'] }
      ]
    : [
        { id: 'preparing', label: 'قيد التجهيز', icon: Flame, match: ['pending', 'preparing'] },
        { id: 'ready', label: 'بانتظار السائق', icon: ShoppingBag, match: ['ready'] },
        { id: 'out_for_delivery', label: 'جاري التوصيل', icon: Truck, match: ['out_for_delivery'] },
        { id: 'delivered', label: 'تم التوصيل', icon: CheckCircle2, match: ['delivered'] }
      ];

  const currentStepIndex = steps.findIndex(s => s.match.includes(status)) !== -1 
    ? steps.findIndex(s => s.match.includes(status)) 
    : 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-start pt-8 px-4 md:px-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md z-50"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-md space-y-5 pb-8 relative mt-4">
        
        {/* Header Title */}
        <div className="text-center space-y-1 mb-2">
          <h2 className="text-2xl font-black text-white tracking-tight">تتبع الطلب</h2>
          <p className="text-white/40 text-xs">شاشتك الحية لمعرفة حالة طلبك خطوة بخطوة</p>
        </div>

        {/* Horizontal Timeline Stepper */}
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-5 relative shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-start relative z-10 w-full">
            {/* Background Line */}
            <div className="absolute top-[19px] left-[10%] right-[10%] h-[2px] bg-white/5 rounded-full z-[-2]" />
            
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              const isNextActive = idx + 1 <= currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
                  {/* Highlighted Line */}
                  {isNextActive && idx < steps.length - 1 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5 }}
                      className="absolute top-[19px] right-[50%] w-full h-[2px] bg-emerald-500 rounded-full origin-right z-[-1]"
                    />
                  )}

                  {/* Icon Circle */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 mb-2 bg-[#0a0a0a] ${
                    isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : isPast 
                        ? 'bg-emerald-500 border-emerald-500 text-black' 
                        : 'border-white/10 text-white/20'
                  }`}>
                    {isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      </motion.div>
                    ) : (
                      <Icon size={16} strokeWidth={isPast ? 2.5 : 2} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center px-1">
                    <h3 className={`font-bold text-[11px] sm:text-xs transition-colors duration-300 ${
                      isActive ? 'text-white' : isPast ? 'text-white/80' : 'text-white/30'
                    }`}>
                      {step.label}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Code Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-5 text-center relative overflow-hidden"
        >
          {/* Subtle glow effect behind QR */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 ${status === 'ready' ? 'bg-blue-500/10' : status === 'delivered' ? 'bg-emerald-500/10' : 'bg-red-500/10'} blur-3xl rounded-full pointer-events-none transition-colors duration-700`} />

          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="text-right">
              <p className="text-white/30 text-[10px] font-medium mb-0.5">رقم الطلب</p>
              <p className="text-white font-mono font-bold text-base tracking-widest">#{shortId}</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[11px] text-white/70">
              {orderDetails ? (orderDetails.order_type === 'pickup' ? 'استلام من الفرع' : 'توصيل') : 'جاري التحميل...'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl relative group z-10 transition-transform duration-300 hover:scale-105">
            <QRCode 
              value={qrValue} 
              size={130} 
              fgColor={
                status === 'delivered' ? '#10b981' : 
                status === 'ready' ? '#3b82f6' : 
                '#ef4444'
              } 
            />
          </div>
          
          <p className="text-white/30 text-[11px] mt-4 relative z-10">
            امسح الكود لعرض فاتورة الطلب بالتفصيل
          </p>

          {status === 'delivered' && googleMapsUrl && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-5 w-full relative z-10"
            >
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 hover:from-yellow-500/20 hover:to-yellow-500/20 border border-yellow-500/30 rounded-2xl p-3 transition-all duration-300 group shadow-[0_0_20px_rgba(234,179,8,0.1)]"
              >
                <div className="flex justify-center gap-1 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" style={{ transitionDelay: `${i * 40}ms` }} />
                  ))}
                </div>
                <p className="text-yellow-400 font-bold text-sm text-center">قيم تجربتك على جوجل ماب</p>
                <p className="text-yellow-500/60 text-[10px] text-center mt-0.5">رأيك يهمنا ويساعدنا على تقديم الأفضل</p>
              </a>
            </motion.div>
          )}
        </motion.div>

          {status === 'out_for_delivery' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-5 w-full relative z-10"
            >
              <button 
                onClick={async () => {
                  try {
                    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
                    
                    if (orderDetails?.notes?.includes('[DOOR_PATH]')) {
                      const match = orderDetails.notes.match(/\[DOOR_PATH\](.*?)\[\/DOOR_PATH\]/);
                      if (match && match[1]) {
                        fetch('/api/delete-image', {
                          method: 'POST',
                          body: JSON.stringify({ path: match[1] }),
                        }).catch(console.error);
                      }
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95"
              >
                <CheckCircle2 size={24} />
                استلمت طلبي بنجاح
              </button>
            </motion.div>
          )}

      </div>
    </div>
  );
}
