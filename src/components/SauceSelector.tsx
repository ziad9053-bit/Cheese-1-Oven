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
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 flex items-start">
      <div className="flex items-start -space-x-3 space-x-reverse md:-space-x-5">
        {sauces.filter(s => s.is_available).map((sauce) => (
          <button
            key={sauce.id}
            onClick={() => onSelectSauce(selectedSauce === sauce.id ? null : sauce.id)}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 w-16 md:w-24 ${
              selectedSauce === sauce.id 
                ? 'z-20 -translate-y-2' 
                : 'z-0 opacity-80 hover:opacity-100 hover:-translate-y-1 hover:z-10'
            }`}
          >
            <div 
              className={`relative w-16 h-16 md:w-24 md:h-24 ${
                selectedSauce === sauce.id ? 'sauce-active' : 'sauce-idle'
              }`}
            >
              <img 
                src={sauce.image_url} 
                alt={sauce.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span 
              className={`text-[11px] md:text-[13px] font-black tracking-wide text-center leading-tight transition-all duration-300 ${
                selectedSauce === sauce.id 
                  ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)]' 
                  : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
              }`}
            >
              {selectedSauce === sauce.id ? sauce.name : 'صوص'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
