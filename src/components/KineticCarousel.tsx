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

// Degrees per frame (≈ 15°/sec at 60fps)
const SPIN_SPEED = 0.25;

export const KineticCarousel: React.FC<Props> = React.memo(({
  products,
  activeIndex,
  onIndexChange,
}) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  /* ─── refs (never cause re-renders) ─────────────────────────────── */
  const itemRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const ringAngle   = useRef(0);     // current visual angle (accumulates forever)
  const targetAngle = useRef<number | null>(null); // non-null → snap mode
  const activeRef   = useRef(activeIndex);
  const isPanning   = useRef(false);
  const countRef    = useRef(products.length);
  const rafId       = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* keep refs current without triggering side-effects */
  useEffect(() => { activeRef.current   = activeIndex;       }, [activeIndex]);
  useEffect(() => { countRef.current    = products.length;   }, [products.length]);

  /* ─── geometry ───────────────────────────────────────────────────── */
  const count        = products.length;
  const safeMobile   = mounted ? isMobile : false;
  const RING_RADIUS  = safeMobile ? 140 : 240;
  const STEP         = count > 0 ? 360 / count : 0;
  const arc          = 2 * Math.PI * RING_RADIUS;
  const raw          = count > 0 ? (arc / count) * 0.80 : 72;
  const ITEM_SIZE    = Math.min(safeMobile ? 54 : 70, Math.max(26, raw));
  const CENTER_SIZE  = RING_RADIUS * 2;

  /* ─── DOM updater ────────────────────────────────────────────────── */
  const pushPositions = useCallback(() => {
    const a  = ringAngle.current;
    const st = STEP;
    const r  = RING_RADIUS;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rad = ((a + i * st) * Math.PI) / 180;
      const x   = Math.sin(rad) * r;
      const y   = -Math.cos(rad) * r;
      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }
  }, [STEP, RING_RADIUS]);

  /* ─── which item is currently nearest the top (12 o'clock) ──────── */
  const nearestIndex = useCallback((): number => {
    const st = STEP;
    if (st === 0) return 0;
    let best = 0, bestDist = Infinity;
    const n = countRef.current;
    for (let i = 0; i < n; i++) {
      let ang = (ringAngle.current + i * st) % 360;
      if (ang < 0) ang += 360;
      const dist = Math.min(ang, 360 - ang);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  }, [STEP]);

  /* ─── snap helper (called ONLY on user interaction) ─────────────── */
  const snapToIndex = useCallback((idx: number) => {
    const st  = STEP;
    if (st === 0) return;
    // How far is item idx from 0° (top)?
    let cur = (ringAngle.current + idx * st) % 360;
    if (cur < 0) cur += 360;
    // We want to rotate by -cur (shortest path)
    let delta = -cur;
    delta = ((delta % 360) + 360) % 360;
    if (delta > 180) delta -= 360;
    targetAngle.current = ringAngle.current + delta;
  }, [STEP]);

  /* ─── main animation loop ────────────────────────────────────────── */
  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      if (targetAngle.current !== null) {
        /* ── SNAP MODE: lerp towards target ── */
        const diff = targetAngle.current - ringAngle.current;
        if (Math.abs(diff) < 0.3) {
          ringAngle.current   = targetAngle.current;
          targetAngle.current = null; // done snapping → resume auto-spin
        } else {
          ringAngle.current += diff * 0.13; // smooth ease-out (frame-based, never teleports)
        }
      } else if (!isPanning.current) {
        /* ── AUTO-SPIN: frame-based constant speed ── */
        ringAngle.current += SPIN_SPEED;
        // Notice: We removed the automatic nearestIndex() update here.
        // The central pizza will now ONLY change when the user explicitly clicks a thumbnail or swipes.
      }

      pushPositions();
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]); // ← intentionally minimal deps: loop runs forever, reads refs directly

  /* ─── pan / swipe ─────────────────────────────────────────────────── */
  const onPanStart = useCallback(() => {
    isPanning.current   = true;
    targetAngle.current = null; // cancel any ongoing snap
  }, []);

  const onPanEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isPanning.current = false;
    const ai = activeRef.current;
    const n  = countRef.current;
    let next = ai;
    if (info.offset.x > 40  || info.velocity.x > 400)  next = (ai + 1) % n;
    if (info.offset.x < -40 || info.velocity.x < -400) next = (ai - 1 + n) % n;
    if (next !== ai) {
      snapToIndex(next);
      onIndexChange(next);
    }
  }, [onIndexChange, snapToIndex]);

  /* ─── render ─────────────────────────────────────────────────────── */
  if (!mounted || count === 0) return null;

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center touch-none pointer-events-auto select-none"
      onPanStart={onPanStart}
      onPanEnd={onPanEnd}
    >
      {/* Complete decorative ring — border closes the circle */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width:     RING_RADIUS * 2,
          height:    RING_RADIUS * 2,
          border:    '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 0 0 1px rgba(236,72,153,0.08), inset 0 0 60px rgba(0,0,0,0.35)',
        }}
      />

      {/* Pizza thumbnail ring — all items visible, no gap */}
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
                  onIndexChange(index);
                }}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className="rounded-full overflow-hidden border-2 shadow-xl transition-all duration-300"
                  style={{
                    width:       ITEM_SIZE,
                    height:      ITEM_SIZE,
                    opacity:     isActive ? 0.35 : 0.88,
                    borderColor: isActive
                      ? 'rgba(236,72,153,0.8)'
                      : 'rgba(255,255,255,0.28)',
                    boxShadow:   isActive
                      ? '0 0 18px rgba(236,72,153,0.55)'
                      : '0 4px 12px rgba(0,0,0,0.5)',
                    transform:   isActive ? 'scale(0.88)' : 'scale(1)',
                  }}
                >
                  {product.image_url
                    ? <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    : <div className="w-full h-full bg-gray-800 flex items-center justify-center">🍕</div>
                  }
                </div>

                {ITEM_SIZE > 42 && (
                  <p
                    className="text-white font-semibold truncate text-center bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-tight"
                    style={{
                      fontSize: Math.max(8, ITEM_SIZE * 0.15),
                      maxWidth: ITEM_SIZE + 20,
                      opacity:  isActive ? 0.4 : 1,
                    }}
                  >
                    {product.name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Name & price below ring */}
      <div
        className="absolute z-30 text-center pointer-events-none"
        style={{
          top:       '50%',
          left:      '50%',
          transform: `translate(-50%, ${RING_RADIUS + 14}px)`,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={products[activeIndex]?.id}
            initial={{ opacity: 0, y: 6  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
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
});

KineticCarousel.displayName = 'KineticCarousel';
