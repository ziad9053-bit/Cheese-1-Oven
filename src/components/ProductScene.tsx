"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Sauce } from '@/lib/data';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  product: Product;
  onAddClick: () => void;
  bgImageUrl?: string;
  selectedSauce?: Sauce | null;
  selectedSalad?: Product | null;
  selectedDrink?: any | null; // using any since Drink/Product have same fields
}

export const ProductScene: React.FC<Props> = ({ 
  product, 
  onAddClick, 
  bgImageUrl,
  selectedSauce,
  selectedSalad,
  selectedDrink
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

      {/* Scene Wrapper for shifting down (z-10 to sit below carousel z-30) */}
      <div className="absolute inset-0 z-10 pointer-events-none translate-y-6 md:translate-y-10">
        {/* Central pizza image — animates only when product changes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {/* We wrap the pizza and the sauce effect in one motion container so they animate in together when product changes */}
          <motion.div
            key={product?.id}
            className="relative w-[200px] h-[200px] md:w-[320px] md:h-[320px]"
            initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.4, opacity: 0, rotate: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
          >
            <img
              src={product?.image_url || ''}
              alt={product?.name || ''}
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] rounded-full"
            />
            
            {/* SAUCE EFFECT LAYER OVER PIZZA */}
            <AnimatePresence>
              {selectedSauce && selectedSauce.description?.startsWith('http') && (
                <motion.img
                  key={`sauce-effect-${selectedSauce.id}`}
                  src={selectedSauce.description}
                  alt="Sauce Effect"
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-xl"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 0.85 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {/* SALAD EFFECT OVER PIZZA (Top-Right) */}
            <div className="absolute -top-12 -right-4 md:-top-16 md:-right-12 z-20 drop-shadow-2xl">
              <AnimatePresence>
                {selectedSalad && (
                  <motion.img
                    key={`salad-effect-${selectedSalad.id}`}
                    src={selectedSalad.image_url}
                    alt="Salad Effect"
                    className="w-28 h-28 md:w-40 md:h-40 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
                    initial={{ opacity: 0, scale: 0.5, y: -20, rotate: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)", transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* DRINK EFFECT OVER PIZZA (Top-Left) */}
            <div className="absolute -top-12 -left-4 md:-top-16 md:-left-12 z-20 drop-shadow-2xl">
              <AnimatePresence>
                {selectedDrink && (
                  <motion.img
                    key={`drink-effect-${selectedDrink.id}`}
                    src={selectedDrink.image_url}
                    alt="Drink Effect"
                    className="w-24 h-32 md:w-32 md:h-48 object-contain"
                    initial={{ opacity: 0, scale: 0.5, y: -20, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)", transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
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
      </div>

      {/* ── Add button + price — OUTSIDE so it can have z-50 and stay above the carousel ── */}
      {mounted && product && (
        <div 
          className="absolute z-50 pointer-events-auto flex flex-row items-center gap-3"
          style={{ 
            top: '50%', 
            left: '50%',
            // We add the vertical translation (24px for mobile, 40px for desktop) here since it's outside the translated wrapper
            transform: `translate(calc(-50% + ${actionX}px), calc(-50% + ${actionY}px + ${safeIsMobile ? 24 : 40}px))` 
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
                {product.price} ريال
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
