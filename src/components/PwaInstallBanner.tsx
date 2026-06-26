"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, ArrowDown } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      return; // Do nothing if it's already installed
    }

    // Check session storage if user dismissed it this session
    if (sessionStorage.getItem('hideInstallBanner')) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowBanner(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('ServiceWorker registration successful');
          },
          function(err) {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isIosDevice) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('App was installed successfully.');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('hideInstallBanner', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: isIOS ? 100 : -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: isIOS ? 100 : -100, opacity: 0 }}
        className={`fixed left-4 right-4 z-[9999] flex flex-col items-center justify-between bg-[#121212]/90 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-w-lg mx-auto ${isIOS ? 'bottom-8' : 'top-4 md:flex-row md:max-w-4xl'}`}
        dir="rtl"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>

        <div className={`flex items-center gap-4 text-white w-full ${isIOS ? 'mb-4' : ''}`}>
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 font-sans">
            🍕
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg leading-tight">ثبت التطبيق الفاخر</h3>
            <p className="text-emerald-500/80 text-xs mt-1">تجربة طلب أسرع ومتابعة حية بدون متصفح!</p>
          </div>
        </div>

        {isIOS ? (
          <div className="flex flex-col items-center justify-center text-center w-full bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50" />
            <p className="text-white/90 text-sm font-bold leading-relaxed relative z-10">
              للحصول على تجربة راقية، اضغط على أيقونة المشاركة <Share size={18} className="inline mx-1 text-emerald-400"/> بالأسفل، ثم اختر <br/> <span className="text-emerald-400 inline-flex items-center gap-1 mt-1">«إضافة إلى الشاشة الرئيسية» <PlusSquare size={16}/></span>
            </p>
            <motion.div 
              animate={{ y: [0, 8, 0] }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="mt-4 relative z-10"
            >
              <ArrowDown size={28} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </motion.div>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="mt-4 md:mt-0 w-full md:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Download size={18} />
            تثبيت الآن مجاناً
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
