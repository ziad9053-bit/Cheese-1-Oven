"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
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

  // Raw rotation angle (continuous, not reset on each step)
  const rotDeg = useRef(0);
  const targetRotDeg = useRef(0);
  const rafRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Auto-rotation timer
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPanning = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const count = products.length;
  const safeIsMobile = mounted ? isMobile : false;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const RING_RADIUS = safeIsMobile ? 130 : 160;
  const STEP_ANGLE = count > 0 ? 360 / count : 0;

  const circumference = 2 * Math.PI * RING_RADIUS;
  const maxItemSize = safeIsMobile ? 58 : 76;
  const minItemSize = 28;
  const rawItemSize = count > 0 ? (circumference / count) * 0.82 : maxItemSize;
  const ITEM_SIZE = Math.min(maxItemSize, Math.max(minItemSize, rawItemSize));

  const CENTER_SIZE = RING_RADIUS * 2;

  // ── Smooth animation loop ─────────────────────────────────────────────────
  const tick = useCallback(() => {
    const diff = targetRotDeg.current - rotDeg.current;
    // Lerp towards target at 12% per frame — smooth & consistent
    if (Math.abs(diff) > 0.05) {
      rotDeg.current += diff * 0.12;
    } else {
      rotDeg.current = targetRotDeg.current;
    }
    if (wheelRef.current) {
      wheelRef.current.style.transform = `translate(-50%,-50%) rotate(${rotDeg.current}deg)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  // ── Snap wheel when activeIndex changes ───────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    // Find shortest path to new target (handles wrapping)
    const rawTarget = -activeIndex * STEP_ANGLE;
    // Adjust so we always rotate the shortest arc
    let delta = rawTarget - targetRotDeg.current;
    // Normalize delta to [-180, 180]
    delta = ((delta + 180) % 360) - 180;
    if (delta < -180) delta += 360;
    targetRotDeg.current = targetRotDeg.current + delta;
  }, [activeIndex, STEP_ANGLE, mounted]);

  // ── Auto-rotation ─────────────────────────────────────────────────────────
  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    autoRef.current = setInterval(() => {
      if (!isPanning.current) {
        onIndexChange((activeIndex + 1) % count);
      }
    }, 3000);
  }, [activeIndex, count, onIndexChange, stopAuto]);

  useEffect(() => {
    if (!mounted || count === 0) return;
    startAuto();
    return stopAuto;
  }, [mounted, activeIndex, count, startAuto, stopAuto]);

  // ── Swipe / Pan ───────────────────────────────────────────────────────────
  const handlePanStart = useCallback(() => {
    isPanning.current = true;
    stopAuto();
  }, [stopAuto]);

  const handlePanEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      isPanning.current = false;
      const { offset, velocity } = info;
      let newIndex = activeIndex;
      if (offset.x > 40 || velocity.x > 400) {
        newIndex = (activeIndex + 1) % count;
      } else if (offset.x < -40 || velocity.x < -400) {
        newIndex = (activeIndex - 1 + count) % count;
      }
      onIndexChange(newIndex);
      // Resume auto after 4s idle
      setTimeout(() => startAuto(), 4000);
    },
    [activeIndex, count, onIndexChange, startAuto]
  );

  if (!mounted || count === 0) return null;

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center touch-none pointer-events-auto select-none"
      onPanStart={handlePanStart}
      onPanEnd={handlePanEnd}
    >
      {/* Decorative ring border */}
      <div
        className="absolute rounded-full border border-white/15 pointer-events-none"
        style={{
          width: RING_RADIUS * 2,
          height: RING_RADIUS * 2,
          boxShadow: '0 0 60px rgba(236,72,153,0.12), inset 0 0 60px rgba(0,0,0,0.3)',
        }}
      />

      {/* Spinning wheel of thumbnails */}
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
          const cx = RING_RADIUS + Math.sin(angleRad) * RING_RADIUS;
          const cy = RING_RADIUS - Math.cos(angleRad) * RING_RADIUS;
          const isActive = index === activeIndex;

          return (
            <div
              key={product.id}
              className="absolute"
              style={{ left: cx, top: cy, transform: 'translate(-50%,-50%)' }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 0.01 : 1,
                  opacity: isActive ? 0 : 0.8,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => {
                  e.stopPropagation();
                  stopAuto();
                  onIndexChange(index);
                }}
                className="cursor-pointer flex flex-col items-center gap-1"
                whileHover={{ scale: isActive ? 0 : 1.2, opacity: isActive ? 0 : 1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div
                  className="rounded-full overflow-hidden border-2 border-white/30 shadow-xl ring-2 ring-transparent hover:ring-pink-500/50 transition-all"
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
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[10px]">🍕</div>
                  )}
                </div>
                {ITEM_SIZE > 42 && (
                  <p
                    className="text-white font-semibold truncate text-center leading-tight bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5"
                    style={{ fontSize: Math.max(8, ITEM_SIZE * 0.16), maxWidth: ITEM_SIZE + 20 }}
                  >
                    {product.name}
                  </p>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Active pizza in center – sized to fill the ring diameter */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ width: CENTER_SIZE, height: CENTER_SIZE }}
      >
        {products[activeIndex]?.image_url && (
          <motion.img
            key={products[activeIndex].id}
            src={products[activeIndex].image_url}
            alt={products[activeIndex].name}
            className="w-full h-full object-contain rounded-full drop-shadow-2xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            draggable={false}
          />
        )}
      </div>

      {/* Name & price below ring */}
      <div
        className="absolute z-30 text-center pointer-events-none"
        style={{ top: '50%', left: '50%', transform: `translate(-50%, ${RING_RADIUS + 10}px)` }}
      >
        <motion.p
          key={products[activeIndex]?.name}
          initial={{ opacity: 0, y: 5 }}
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
