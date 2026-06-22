"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Product } from '@/lib/data';

interface Props {
  products: Product[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export const KineticCarousel: React.FC<Props> = ({ products, activeIndex, onIndexChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cardWidth = 100;
  const gap = 16;
  const itemWidth = cardWidth + gap;

  useEffect(() => {
    if (mounted) {
      controls.start({
        x: activeIndex * itemWidth, // RTL: positive x moves container to the right, showing items on the left
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      });
    }
  }, [activeIndex, controls, itemWidth, mounted]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    let newIndex = activeIndex;
    
    // In RTL, dragging right (positive) reveals items on the left (next items)
    if (offset > 50 || velocity > 500) {
      newIndex = Math.min(activeIndex + 1, products.length - 1);
    } else if (offset < -50 || velocity < -500) {
      newIndex = Math.max(activeIndex - 1, 0);
    }
    
    onIndexChange(newIndex);
  };

  if (!mounted || products.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[140px] overflow-hidden flex items-center bg-black/40 backdrop-blur-md border-t border-white/10"
      ref={containerRef}
    >
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />

      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[110px] border-x-2 border-primary/50 bg-primary/10 z-0" />

      <motion.div
        drag="x"
        dragConstraints={{
          left: 0,
          right: (products.length - 1) * itemWidth
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="flex items-center gap-[16px] px-[calc(50%-50px)]"
        style={{ width: 'max-content' }}
      >
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          
          return (
            <motion.div
              key={product.id}
              className="relative shrink-0 flex flex-col items-center justify-center cursor-pointer"
              style={{ width: cardWidth }}
              onClick={() => onIndexChange(index)}
              animate={{
                scale: isActive ? 1.1 : 0.85,
                opacity: isActive ? 1 : 0.5,
                y: isActive ? -10 : 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className={`w-[80px] h-[80px] rounded-full overflow-hidden shadow-xl border-2 transition-colors ${isActive ? 'border-primary ring-4 ring-primary/30' : 'border-white/10'}`}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">No Image</div>
                )}
              </div>
              <div className="mt-3 text-center w-full">
                <p className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {product.name}
                </p>
                <p className={`text-[10px] font-black transition-colors ${isActive ? 'text-primary' : 'text-white/40'}`}>
                  {product.price} ر.س
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
