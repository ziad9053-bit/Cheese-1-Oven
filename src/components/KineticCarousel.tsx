"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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

  // Direct DOM refs — no React state needed for animation (zero re-renders during spin)
  const itemRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const currentAng = useRef(0);   // current visual angle
  const targetAng  = useRef(0);   // desired snapped angle
  const rafId      = useRef<number | null>(null);
  const activeRef  = useRef(activeIndex);

  const autoRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPanning = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { activeRef.current = activeIndex; }, [activeIndex]);

  const count = products.length;
  const safeIsMobile = mounted ? isMobile : false;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const RING_RADIUS = safeIsMobile ? 125 : 150;
  // Closed ring: divide 360° equally among all pizzas
  const STEP = count > 0 ? 360 / count : 0;

  // Dynamic item size: fit within the arc length assigned to each item
  const arc = 2 * Math.PI * RING_RADIUS;
  const RAW  = count > 0 ? (arc / count) * 0.80 : 72;
  const MAX  = safeIsMobile ? 54 : 70;
  const MIN  = 26;
  const ITEM_SIZE   = Math.min(MAX, Math.max(MIN, RAW));
  const CENTER_SIZE = RING_RADIUS * 2;

  // ── Direct-DOM position updater (called every rAF tick) ─────────────────
  const pushPositions = useCallback(() => {
    const a = currentAng.current;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const deg = a + i * STEP;
      const rad = (deg * Math.PI) / 180;
      const x   = Math.sin(rad) * RING_RADIUS;
      const y   = -Math.cos(rad) * RING_RADIUS;
      // translate relative to center; item is absolute top:50% left:50%
      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }
  }, [STEP, RING_RADIUS]);

  // ── rAF animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      let diff = targetAng.current - currentAng.current;
      // Shortest-arc normalisation → always take the < 180° path
      diff = ((diff % 360) + 360) % 360;
      if (diff > 180) diff -= 360;

      if (Math.abs(diff) > 0.02) {
        currentAng.current += diff * 0.11; // lerp 11% per frame → silky 60fps
      } else {
        currentAng.current = targetAng.current;
      }

      pushPositions();
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [mounted, pushPositions]);

  // ── Snap target whenever activeIndex changes ─────────────────────────────
  useEffect(() => {
    if (!mounted || STEP === 0) return;
    const raw = -activeIndex * STEP;
    // Shortest delta from current target
    let delta = raw - targetAng.current;
    delta = ((delta % 360) + 360) % 360;
    if (delta > 180) delta -= 360;
    targetAng.current += delta;
  }, [activeIndex, STEP, mounted]);

  // ── Auto-rotation (restarts only once per activeIndex change) ────────────
  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    autoRef.current = setInterval(() => {
      if (!isPanning.current) {
        onIndexChange((activeRef.current + 1) % count);
      }
    }, 3000);
  }, [count, onIndexChange, stopAuto]);

  // Start auto only once on mount; activeIndex changes tracked via ref
  useEffect(() => {
    if (!mounted || count === 0) return;
    startAuto();
    return stopAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, count]);

  // ── Pan / Swipe ───────────────────────────────────────────────────────────
  const handlePanStart = useCallback(() => {
    isPanning.current = true;
    stopAuto();
  }, [stopAuto]);

  const handlePanEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isPanning.current = false;
    const ai = activeRef.current;
    let next = ai;
    if (info.offset.x > 40  || info.velocity.x > 400) next = (ai + 1) % count;
    if (info.offset.x < -40 || info.velocity.x < -400) next = (ai - 1 + count) % count;
    onIndexChange(next);
    // Resume auto after 4 s idle
    setTimeout(startAuto, 4000);
  }, [count, onIndexChange, startAuto]);

  if (!mounted || count === 0) return null;

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center touch-none pointer-events-auto select-none"
      onPanStart={handlePanStart}
      onPanEnd={handlePanEnd}
    >
      {/* ── Decorative ring ──────────────────────────────────────────── */}
      <div
        className="absolute rounded-full border border-white/10 pointer-events-none"
        style={{
          width:  RING_RADIUS * 2,
          height: RING_RADIUS * 2,
          boxShadow: '0 0 50px rgba(236,72,153,0.08), inset 0 0 50px rgba(0,0,0,0.25)',
        }}
      />

      {/* ── Pizza thumbnails (position driven purely by rAF → zero React renders) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={product.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              className="absolute"
              style={{ top: '50%', left: '50%' }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  stopAuto();
                  onIndexChange(index);
                  // Resume auto after 4 s
                  setTimeout(startAuto, 4000);
                }}
                className="flex flex-col items-center gap-1 cursor-pointer select-none"
                style={{
                  opacity:       isActive ? 0 : 0.85,
                  transform:     isActive ? 'scale(0.01)' : 'scale(1)',
                  transition:    'opacity 0.28s ease, transform 0.28s ease',
                  pointerEvents: isActive ? 'none' : 'auto',
                }}
              >
                <div
                  className="rounded-full overflow-hidden border-2 border-white/30 shadow-xl transition-shadow hover:border-pink-400 hover:shadow-pink-500/40"
                  style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                >
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" draggable={false} />
                    : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[10px]">🍕</div>
                  }
                </div>
                {ITEM_SIZE > 42 && (
                  <p
                    className="text-white font-semibold truncate text-center bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-tight"
                    style={{ fontSize: Math.max(8, ITEM_SIZE * 0.15), maxWidth: ITEM_SIZE + 18 }}
                  >
                    {product.name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Central active pizza — jumps to center on selection ──────── */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ width: CENTER_SIZE, height: CENTER_SIZE }}
      >
        <AnimatePresence mode="wait">
          {products[activeIndex]?.image_url && (
            <motion.img
              key={products[activeIndex].id}
              src={products[activeIndex].image_url}
              alt={products[activeIndex].name}
              className="w-full h-full object-contain rounded-full"
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.85))' }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.25, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Name & price below ring ───────────────────────────────────── */}
      <div
        className="absolute z-30 text-center pointer-events-none"
        style={{
          top:  '50%',
          left: '50%',
          transform: `translate(-50%, ${RING_RADIUS + 14}px)`,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={products[activeIndex]?.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-sm font-black text-white drop-shadow-md whitespace-nowrap">
              {products[activeIndex]?.name}
            </p>
            <p className="text-xs font-bold text-pink-400">
              {products[activeIndex]?.price} ر.س
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
