"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Do nothing if it's already installed
    }

    // Check session storage if user dismissed it this session
    if (sessionStorage.getItem('hideInstallBanner')) {
      return;
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
      e.preventDefault(); // Prevent Chrome 67 and earlier from automatically showing the prompt
      setDeferredPrompt(e);
      // Show the banner
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      // User successfully installed the app
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
    
    // Show the install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-[9999] flex flex-col md:flex-row items-center justify-between bg-[#121212]/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-4 shadow-2xl max-w-4xl mx-auto"
        dir="rtl"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-3 left-3 md:relative md:top-0 md:left-0 w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/50 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 text-white">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 font-sans">
            🍕
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg">ثبت التطبيق الفاخر على جوالك</h3>
            <p className="text-emerald-500/70 text-xs">احصل على أسرع تجربة لطلب البيتزا ومتابعتها بدون متصفح!</p>
          </div>
        </div>

        <button 
          onClick={handleInstallClick}
          className="mt-4 md:mt-0 w-full md:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Download size={18} />
          تثبيت التطبيق مجاناً
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
