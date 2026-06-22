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
        rotate: activeIndex * 25, // Positive rotation in RTL for counter-clockwise items
        transition: { type: 'spring', stiffness: 200, damping: 30 }
      });
    }
  }, [activeIndex, controls, mounted]);

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    let newIndex = activeIndex;
    
    // In RTL, dragging right (positive) reveals items on the left (next items)
    if (offset > 40 || velocity > 400) {
      newIndex = Math.min(activeIndex + 1, products.length - 1);
    } else if (offset < -40 || velocity < -400) {
      newIndex = Math.max(activeIndex - 1, 0);
    }
    
    onIndexChange(newIndex);
  };

  if (!mounted || products.length === 0) return null;

  const radius = 280;
  const stepAngle = 25;

  return (
    <motion.div 
      onPanEnd={handlePanEnd}
      className="relative w-full h-[180px] overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-md border-t border-white/10 touch-none"
    >
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[120px] bg-gradient-to-b from-primary/20 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-primary/30 blur-2xl rounded-full" />

      {/* The invisible spinning wheel */}
      <motion.div
        animate={controls}
        className="absolute"
        style={{
          width: radius * 2,
          height: radius * 2,
          bottom: -(radius * 2) + 120, // centers the active item nicely
          left: '50%',
          x: '-50%',
          borderRadius: '50%',
          zIndex: 10,
        }}
      >
        {products.map((product, index) => {
          const itemAngle = -index * stepAngle; // Items distributed counter-clockwise for RTL
          const isActive = index === activeIndex;
          
          return (
            <motion.div
              key={product.id}
              className="absolute top-1/2 left-1/2"
              style={{ rotate: itemAngle }}
            >
              <motion.div style={{ y: -radius }}>
                <motion.div
                  className="flex flex-col items-center justify-center cursor-pointer absolute"
                  style={{ x: '-50%', y: '-50%' }}
                  animate={{
                    // Counter rotate so text and pizza stay upright!
                    rotate: -itemAngle - (activeIndex * stepAngle),
                    scale: isActive ? 1.15 : 0.75,
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => onIndexChange(index)}
                >
                  <div className={`w-[80px] h-[80px] rounded-full overflow-hidden shadow-2xl border-2 transition-colors duration-300 ${isActive ? 'border-primary ring-4 ring-primary/40' : 'border-white/10'}`}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">بدون صورة</div>
                    )}
                  </div>
                  
                  <div className={`mt-3 text-center w-28 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <p className="text-sm font-bold text-white truncate drop-shadow-md">
                      {product.name}
                    </p>
                    <p className="text-xs font-black text-primary drop-shadow-md">
                      {product.price} ر.س
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
