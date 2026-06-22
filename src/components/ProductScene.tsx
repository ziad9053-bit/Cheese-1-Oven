"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Sauce } from '@/lib/data';
import { Plus, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  product: Product;
  onAddClick: () => void;
  onAddSauce: (sauce: Sauce) => void;
  selectedSauceIds?: string[];
  bgImageUrl?: string;
  sauces: Sauce[];
}

export const ProductScene: React.FC<Props> = ({ 
  product, 
  onAddClick, 
  onAddSauce, 
  selectedSauceIds = [], 
  bgImageUrl,
  sauces
}) => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [loadedBg, setLoadedBg] = useState<string>(bgImageUrl || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload background before switching to prevent disappearing/blank flashes
  useEffect(() => {
    if (!bgImageUrl || bgImageUrl === loadedBg) return;
    const img = new window.Image();
    img.src = bgImageUrl;
    img.onload = () => {
      setLoadedBg(bgImageUrl);
    };
  }, [bgImageUrl, loadedBg]);

  const safeIsMobile = mounted ? isMobile : false;
  const pizzaRadius = safeIsMobile ? 88 : 145;
  const sauceRadius = safeIsMobile ? 80 : 130; 
  
  const startAngle = 180;
  const endAngle = 360;

  const actionAngle = 90;
  const actionAngleRad = (actionAngle * Math.PI) / 180;
  const actionX = Math.cos(actionAngleRad) * pizzaRadius;
  const actionY = Math.sin(actionAngleRad) * pizzaRadius;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-transparent">
      {/* Background with crossfade */}
      <AnimatePresence mode="popLayout">
        <motion.img 
          key={loadedBg}
          src={loadedBg}
          alt="App Background"
          className="absolute inset-0 w-full h-full object-cover"
          data-ai-hint="pizza oven neon sign"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Scene Wrapper for shifting down */}
      <div className="absolute inset-0 pointer-events-none translate-y-6 md:translate-y-10">
        {/* Central pizza image — animates only when product changes */}
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={product?.id}
            src={product?.image_url || ''}
            alt={product?.name || ''}
            className="w-[200px] h-[200px] md:w-[320px] md:h-[320px] object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] rounded-full"
            initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.4, opacity: 0, rotate: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
          />
        </AnimatePresence>

        {/* Shadow under pizza */}
        <div className="absolute bottom-[calc(50%-20px)] left-1/2 -translate-x-1/2 w-[200px] md:w-[320px] h-[20px] bg-black/80 blur-[25px] rounded-full" />
        
        {/* Animated Name Overlay */}
        <AnimatePresence>
          {mounted && product && (
            <motion.div
              key={`name-anim-${product.id}`}
              className="absolute z-50 pointer-events-none flex items-center justify-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ 
                scale: [1.5, 1, 1, 0], 
                opacity: [0, 1, 1, 0],
              }}
              transition={{ 
                duration: 2.2, 
                times: [0, 0.15, 0.65, 1],
                ease: "easeInOut"
              }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(236,72,153,1)] text-center px-4 leading-tight">
                {product.name}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sauce orbits — OUTSIDE AnimatePresence so they never flicker ── */}
      {mounted && sauces && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          {sauces.map((sauce, index) => {
            const angle = startAngle + (index * (endAngle - startAngle) / Math.max(1, sauces.length - 1));
            const angleRad = (angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * sauceRadius;
            const y = Math.sin(angleRad) * sauceRadius;
            const isSelected = selectedSauceIds.includes(sauce.id);

            return (
              <div
                key={sauce.id}
                className="absolute pointer-events-auto"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div 
                  className="flex flex-col items-center gap-1.5 group/sauce cursor-pointer"
                  onClick={() => onAddSauce(sauce)}
                >
                  <motion.div 
                    className={`w-6 h-6 md:w-9 md:h-9 rounded-full border shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover/sauce:scale-125 ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black' : 'border-white/40'}`}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ 
                      background: `radial-gradient(circle at 30% 30%, ${sauce.color}, rgba(0,0,0,0.6))`,
                      boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)`
                    }}
                  >
                    <div className="w-full h-1/2 bg-white/10 absolute top-0 rounded-t-full" />
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </motion.div>
                  
                  <div className={`flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full border transition-colors ${isSelected ? 'border-primary' : 'border-white/10 group-hover/sauce:border-primary/50'}`}>
                    <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full flex items-center justify-center shadow-[0_0_5px_rgba(220,38,38,0.5)] ${isSelected ? 'bg-green-500' : 'bg-red-600'}`}>
                      {isSelected ? <Check className="w-1.5 h-1.5 md:w-2 md:h-2 text-white stroke-[4px]" /> : <Plus className="w-1.5 h-1.5 md:w-2 md:h-2 text-white stroke-[4px]" />}
                    </div>
                    <span className="text-[6px] md:text-[8px] font-black text-white whitespace-nowrap">
                      {sauce.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add button + price — OUTSIDE AnimatePresence so they never flicker ── */}
      {mounted && product && (
        <div 
          className="absolute z-50 pointer-events-auto flex flex-row items-center gap-3"
          style={{ 
            top: '50%', 
            left: '50%',
            transform: `translate(calc(-50% + ${actionX}px), calc(-50% + ${actionY}px))` 
          }}
        >
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            className="w-10 h-10 md:w-12 md:h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.8)] border-2 border-white neon-glow-pink cursor-pointer"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 stroke-[4px]" />
          </motion.button>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={product.price}
              initial={{ y: 4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -4, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-2 py-1 flex items-center justify-center drop-shadow-xl"
            >
              <span className="text-xl md:text-3xl font-black text-pink-500 whitespace-nowrap drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] [text-shadow:_-1.5px_-1.5px_0_#FFF,_1.5px_-1.5px_0_#FFF,_-1.5px_1.5px_0_#FFF,_1.5px_1.5px_0_#FFF]">
                {product.price} ر.س
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      </div>
    </div>
  );
};
