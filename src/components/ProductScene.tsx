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

  useEffect(() => { setMounted(true); }, []);

  const currentBg = bgImageUrl || "";
  
  const safeIsMobile = mounted ? isMobile : false;
  const pizzaRadius = safeIsMobile ? 110 : 185;
  const sauceRadius = safeIsMobile ? 80 : 130; 
  
  const startAngle = 180;
  const endAngle = 360;

  const actionAngle = 0;
  const actionAngleRad = (actionAngle * Math.PI) / 180;
  const actionX = Math.cos(actionAngleRad) * pizzaRadius;
  const actionY = Math.sin(actionAngleRad) * pizzaRadius;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-transparent">
      {/* Background */}
      {currentBg && (
        <>
          <img 
            src={currentBg}
            alt="App Background"
            className="absolute inset-0 w-full h-full object-cover"
            data-ai-hint="pizza oven neon sign"
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Central pizza image — animates only when product changes */}
      <div className="relative z-40 w-full h-full flex items-center justify-center pointer-events-none">
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
          className="absolute z-50 pointer-events-auto flex flex-col items-center gap-1.5"
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
            className="w-6 h-6 md:w-8 md:h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.7)] border border-white/30 neon-glow-pink cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 md:w-5 md:h-5 stroke-[4px]" />
          </motion.button>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={product.price}
              initial={{ y: 4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -4, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/20 shadow-2xl"
            >
              <span className="text-[10px] md:text-xs font-black text-primary whitespace-nowrap">{product.price} ر.س</span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
