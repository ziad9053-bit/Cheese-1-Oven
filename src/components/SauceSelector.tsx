"use client";

import React from 'react';
import { Sauce } from '@/lib/data';

interface Props {
  sauces: Sauce[];
  selectedSauce: number | null;
  onSelectSauce: (id: number | null) => void;
}

export default function SauceSelector({ sauces, selectedSauce, onSelectSauce }: Props) {
  return (
    <div className="fixed bottom-6 right-6 md:right-8 z-40 flex items-end">
      <div className="flex items-end gap-2 md:gap-4">
        {sauces.filter(s => s.is_available).map((sauce, i, arr) => {
          const isLeftmost = i === arr.length - 1;
          const isSecondLeftmost = i === arr.length - 2;
          
          // -mr-4 md:-mr-5 will shift the item to the right (towards the adjacent sauce).
          // Applying it to both the leftmost and second-leftmost shifts them together, 
          // while the leftmost gets a double shift relative to the rest of the group.
          const marginClass = (isLeftmost || isSecondLeftmost) ? "-mr-4 md:-mr-5" : "";

          return (
            <button
              key={sauce.id}
              onClick={() => onSelectSauce(selectedSauce === sauce.id ? null : sauce.id)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 md:w-20 ${marginClass} ${
                selectedSauce === sauce.id 
                  ? 'scale-110 -translate-y-2' 
                  : 'opacity-70 hover:opacity-100 hover:scale-105 hover:-translate-y-1'
              }`}
            >
            <div 
              className="relative w-14 h-14 md:w-20 md:h-20"
              style={{
                transition: 'transform .25s ease',
                filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.25))',
                transform: selectedSauce === sauce.id ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)'
              }}
            >
              <img 
                src={sauce.image_url} 
                alt={sauce.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className={`text-[11px] md:text-[13px] font-black tracking-wide text-center leading-tight transition-all duration-300 ${
              selectedSauce === sauce.id 
                ? 'text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' 
                : 'text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
            }`}>
              {selectedSauce === sauce.id ? sauce.name : 'صوص'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
