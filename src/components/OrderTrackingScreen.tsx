"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ChefHat, CheckCircle, Package, ArrowRight, X } from 'lucide-react';

interface OrderTrackingScreenProps {
  orderId: string;
  onClose: () => void;
}

export function OrderTrackingScreen({ orderId, onClose }: OrderTrackingScreenProps) {
  const [status, setStatus] = useState<string>('pending');
  const [orderType, setOrderType] = useState<string>('pickup');

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase.from('orders').select('status, order_type').eq('id', orderId).single();
      if (data) {
        setStatus(data.status);
        setOrderType(data.order_type);
      }
    };
    
    fetchStatus();

    const sub = supabase.channel(`order_tracking_${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setStatus(payload.new.status);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6" dir="rtl">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <p className="text-white/50 text-sm font-bold tracking-widest">حالة الطلب</p>
          
          {status === 'pending' || status === 'preparing' ? (
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 mx-auto bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center border-4 border-orange-500/30"
            >
              <ChefHat size={48} />
            </motion.div>
          ) : status === 'out_for_delivery' ? (
            <motion.div 
              animate={{ x: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 mx-auto bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center border-4 border-blue-500/30"
            >
              <Package size={48} />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto bg-green-500/20 text-green-500 rounded-full flex items-center justify-center border-4 border-green-500/30"
            >
              <CheckCircle size={48} />
            </motion.div>
          )}

          <h2 className="text-3xl font-black text-white">
            {status === 'pending' || status === 'preparing' 
              ? 'قيد التجهيز 👨‍🍳' 
              : status === 'out_for_delivery'
                ? 'جاري التوصيل 🛵'
                : status === 'delivered'
                  ? 'تم التوصيل! 🎉'
                  : 'طلبك جاهز! 🎉'}
          </h2>
          
          <p className="text-white/60">
            {status === 'pending' || status === 'preparing' 
              ? 'يتم الآن تحضير طلبك بكل حب واهتمام في المطبخ.'
              : status === 'out_for_delivery'
                ? 'السائق في الطريق إليك الآن، استعد لاستلام طلبك الساخن.'
                : status === 'delivered'
                  ? 'تم تسليم طلبك بنجاح. بالعافية!'
                  : orderType === 'pickup' 
                    ? 'طلبك جاهز الآن، بانتظار وصولك لاستلامه من المحل 🚗'
                    : 'طلبك جاهز، وبانتظار استلام السائق له لتوصيله 🛵'
            }
          </p>
        </div>

        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
          <p className="text-white/40 text-xs mb-1">رقم الطلب</p>
          <p className="text-white font-mono font-bold">{String(orderId).includes('-') ? String(orderId).split('-')[0].toUpperCase() : String(orderId).toUpperCase()}</p>
        </div>
      </motion.div>
    </div>
  );
}
