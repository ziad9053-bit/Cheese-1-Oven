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
    supabase.from('store_roles').select('pin_code').eq('role_name', 'google_maps_url').single().then(({ data }) => {
      if (data && data.pin_code) {
        setGoogleMapsUrl(data.pin_code);
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
    <div className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-start pt-16 px-6 overflow-y-auto custom-scrollbar" dir="rtl">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-md space-y-8 pb-12">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">تتبع الطلب</h2>
          <p className="text-white/40 text-sm">شاشتك الحية لمعرفة حالة طلبك خطوة بخطوة</p>
        </div>

        {/* Timeline Stepper */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative">
          <div className="absolute top-0 bottom-0 right-[47px] w-[2px] bg-white/5 rounded-full" />
          
          <div className="space-y-8 relative z-10">
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-6 relative">
                  {/* Line Connection Highlight */}
                  {isPast && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      className="absolute top-10 right-[15px] w-[2px] bg-emerald-500 rounded-full origin-top"
                    />
                  )}

                  {/* Icon Circle */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 z-10 ${
                    isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                      : isPast 
                        ? 'bg-emerald-500 border-emerald-500 text-black' 
                        : 'bg-[#121212] border-white/10 text-white/20'
                  }`}>
                    {isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      </motion.div>
                    ) : (
                      <Icon size={18} strokeWidth={isPast ? 2.5 : 2} />
                    )}
                  </div>

                  {/* Label */}
                  <div>
                    <h3 className={`font-bold text-lg transition-colors duration-300 ${
                      isActive ? 'text-white' : isPast ? 'text-white/80' : 'text-white/30'
                    }`}>
                      {step.label}
                    </h3>
                    {isActive && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-emerald-500/70 text-xs mt-1 font-medium"
                      >
                        الآن قيد التنفيذ
                      </motion.p>
                    )}
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
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-6 text-center"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="text-right">
              <p className="text-white/40 text-xs font-medium mb-1">رقم الطلب</p>
              <p className="text-white font-mono font-bold text-lg tracking-widest">#{shortId}</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-white/70">
              {orderDetails ? (orderDetails.order_type === 'pickup' ? 'استلام من الفرع' : 'توصيل') : 'جاري التحميل...'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl relative group">
            <div className={`absolute inset-0 ${status === 'ready' || status === 'delivered' ? 'bg-emerald-500/20' : 'bg-red-400/20'} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <QRCode 
              value={qrValue} 
              size={160} 
              fgColor={status === 'ready' || status === 'delivered' ? '#10b981' : '#f87171'} 
              className="relative z-10"
            />
          </div>
          
          <p className="text-white/40 text-xs mt-6">
            امسح الكود لعرض فاتورة الطلب الاحترافية التفصيلية
          </p>

          {status === 'delivered' && googleMapsUrl && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="mt-6 w-full max-w-sm mx-auto"
            >
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 transition-all group"
              >
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={24} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>
                <p className="text-yellow-400 font-bold text-lg text-center">قيمنا على جوجل ماب</p>
                <p className="text-yellow-500/60 text-xs text-center mt-1">رأيك يهمنا ويساعدنا على تقديم الأفضل</p>
              </a>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
