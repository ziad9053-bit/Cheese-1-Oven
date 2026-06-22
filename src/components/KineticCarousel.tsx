"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Product } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  products: Product[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export const KineticCarousel: React.FC<Props> = ({ products, activeIndex, onIndexChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

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

  const safeIsMobile = mounted ? isMobile : false;
  const radius = safeIsMobile ? 180 : 350; // Responsive radius to fit screen width
  const stepAngle = 25;

  return (
    <motion.div 
      onPanEnd={handlePanEnd}
      className="relative w-full h-full overflow-hidden flex items-center justify-center pointer-events-auto touch-none"
    >
      {/* The invisible spinning wheel centered on screen */}
      <motion.div
        animate={controls}
        className="absolute top-1/2 left-1/2"
        style={{
          width: radius * 2,
          height: radius * 2,
          x: '-50%',
          y: '-50%',
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
                    scale: isActive ? 0 : 0.85, // Hide active from ring since it's in the center
                    opacity: isActive ? 0 : 0.6,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => onIndexChange(index)}
                >
                  <div className="w-[90px] h-[90px] rounded-full overflow-hidden shadow-2xl border-2 border-white/20 transition-colors duration-300">
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
                  
                  <div className="mt-2 text-center w-28 bg-black/50 backdrop-blur-sm rounded-lg py-1 px-2 border border-white/10">
                    <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                      {product.name}
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
