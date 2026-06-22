"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, animate, PanInfo } from 'framer-motion';
import { Product } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  products: Product[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export const KineticCarousel: React.FC<Props> = ({ products, activeIndex, onIndexChange }) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const rotationRef = useRef(0);        // Current wheel rotation in degrees
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const count = products.length;
  const safeIsMobile = mounted ? isMobile : false;

  // ── Ring geometry ────────────────────────────────────────────────────────────
  // Fixed ring radius (smaller, compact as requested)
  const RING_RADIUS = safeIsMobile ? 130 : 160;

  // Step angle: evenly divide 360° by number of products → closed ring
  const STEP_ANGLE = count > 0 ? 360 / count : 0;

  // Dynamic item size: fit items along the circumference without overlap.
  // Arc length available per item = circumference / count.
  // We use ~85% of that arc length as the item diameter (capped for readability).
  const circumference = 2 * Math.PI * RING_RADIUS;
  const maxItemSize = safeIsMobile ? 60 : 80;
  const minItemSize = 30;
  const rawItemSize = count > 0 ? (circumference / count) * 0.85 : maxItemSize;
  const ITEM_SIZE = Math.min(maxItemSize, Math.max(minItemSize, rawItemSize));

  // Central pizza size = diameter of the ring (so it fills the ring exactly)
  const CENTER_SIZE = RING_RADIUS * 2;

  // ── Rotation helpers ─────────────────────────────────────────────────────────
  const rotateTo = useCallback((targetDeg: number, isSnap = false) => {
    if (!wheelRef.current) return;
    const from = rotationRef.current;
    animate(from, targetDeg, {
      duration: isSnap ? 0.5 : 0.4,
      ease: isSnap ? [0.22, 1, 0.36, 1] : 'easeOut',
      onUpdate: (v) => {
        rotationRef.current = v;
        if (wheelRef.current) {
          wheelRef.current.style.transform = `translate(-50%,-50%) rotate(${v}deg)`;
        }
      },
    });
  }, []);

  // Snap wheel when activeIndex changes
  useEffect(() => {
    if (!mounted) return;
    const targetRot = -activeIndex * STEP_ANGLE;
    rotateTo(targetRot, true);
  }, [activeIndex, STEP_ANGLE, mounted, rotateTo]);

  // ── Auto-rotation (pauses on interaction) ───────────────────────────────────
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoRotate = useCallback(() => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    autoRotateRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % count;
      onIndexChange(nextIndex);
    }, 3000);
  }, [activeIndex, count, onIndexChange]);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  }, []);

  // Start auto-rotation on mount, restart when active changes
  useEffect(() => {
    if (!mounted || count === 0) return;
    startAutoRotate();
    return () => stopAutoRotate();
  }, [mounted, activeIndex, count, startAutoRotate, stopAutoRotate]);

  // ── Drag / Swipe ─────────────────────────────────────────────────────────────
  const handlePanStart = useCallback(() => {
    stopAutoRotate();
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
  }, [stopAutoRotate]);

  const handlePanEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      let newIndex = activeIndex;
      if (offset.x > 40 || velocity.x > 400) {
        newIndex = (activeIndex + 1) % count;
      } else if (offset.x < -40 || velocity.x < -400) {
        newIndex = (activeIndex - 1 + count) % count;
      }
      onIndexChange(newIndex);
      // Resume auto-rotation after 4 s of idle
      autoTimerRef.current = setTimeout(() => startAutoRotate(), 4000);
    },
    [activeIndex, count, onIndexChange, startAutoRotate]
  );

  if (!mounted || count === 0) return null;

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center touch-none pointer-events-auto"
      onPanStart={handlePanStart}
      onPanEnd={handlePanEnd}
    >
      {/* ── Decorative ring border ── */}
      <div
        className="absolute rounded-full border border-white/10 pointer-events-none"
        style={{
          width: RING_RADIUS * 2,
          height: RING_RADIUS * 2,
          boxShadow: '0 0 40px rgba(236,72,153,0.08), inset 0 0 40px rgba(236,72,153,0.05)',
        }}
      />

      {/* ── Active pizza – fills the ring diameter ── */}
      <div className="absolute z-20 pointer-events-none" style={{ width: CENTER_SIZE, height: CENTER_SIZE }}>
        {products[activeIndex]?.image_url && (
          <motion.img
            key={products[activeIndex].id}
            src={products[activeIndex].image_url}
            alt={products[activeIndex].name}
            className="w-full h-full object-contain rounded-full drop-shadow-2xl"
            initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            draggable={false}
          />
        )}
      </div>

      {/* ── Spinning wheel (the ring of pizza thumbnails) ── */}
      <div
        ref={wheelRef}
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          width: RING_RADIUS * 2,
          height: RING_RADIUS * 2,
          transform: 'translate(-50%,-50%) rotate(0deg)',
          willChange: 'transform',
        }}
      >
        {products.map((product, index) => {
          const angleDeg = index * STEP_ANGLE;
          const angleRad = (angleDeg * Math.PI) / 180;
          // Position on ring: from center (radius, radius) offset by radius
          const cx = RING_RADIUS + Math.sin(angleRad) * RING_RADIUS;
          const cy = RING_RADIUS - Math.cos(angleRad) * RING_RADIUS;
          const isActive = index === activeIndex;

          return (
            <div
              key={product.id}
              className="absolute"
              style={{
                left: cx,
                top: cy,
                transform: 'translate(-50%,-50%)',
              }}
            >
              {/* Counter-rotate each item so it stays upright */}
              <motion.div
                animate={{ rotate: 0 }}
                style={{ rotate: 0 }}
                className="relative"
              >
                {/* Dynamic counter-rotation wrapper via CSS custom property */}
                <div
                  style={{ rotate: `calc(-1 * var(--wheel-rot, 0deg))` } as React.CSSProperties}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 0.01 : 1, // Disappear from ring when active (shown in center)
                      opacity: isActive ? 0 : 0.75,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={() => { stopAutoRotate(); onIndexChange(index); }}
                    className="cursor-pointer flex flex-col items-center gap-1"
                    whileHover={{ scale: isActive ? 0.01 : 1.15, opacity: isActive ? 0 : 1 }}
                  >
                    <div
                      className="rounded-full overflow-hidden border-2 border-white/20 shadow-xl"
                      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-500">
                          🍕
                        </div>
                      )}
                    </div>
                    {ITEM_SIZE > 44 && (
                      <p
                        className="text-white font-semibold truncate text-center leading-tight"
                        style={{ fontSize: Math.max(8, ITEM_SIZE * 0.17), maxWidth: ITEM_SIZE + 16 }}
                      >
                        {product.name}
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* ── Product name & price label (below ring) ── */}
      <div
        className="absolute z-30 text-center pointer-events-none"
        style={{ top: '50%', left: '50%', transform: `translate(-50%, ${RING_RADIUS + 12}px)` }}
      >
        <motion.p
          key={products[activeIndex]?.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-black text-white drop-shadow-md whitespace-nowrap"
        >
          {products[activeIndex]?.name}
        </motion.p>
        <motion.p
          key={products[activeIndex]?.price}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-bold text-pink-400"
        >
          {products[activeIndex]?.price} ر.س
        </motion.p>
      </div>
    </motion.div>
  );
};
