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
        {sauces.filter(s => s.is_available).map((sauce) => (
          <button
            key={sauce.id}
            onClick={() => onSelectSauce(selectedSauce === sauce.id ? null : sauce.id)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 md:w-20 ${
              selectedSauce === sauce.id 
                ? 'scale-125 -translate-y-2' 
                : 'opacity-70 hover:opacity-100 hover:scale-110 hover:-translate-y-1'
            }`}
          >
            <div className={`transform transition-transform duration-300 relative w-14 h-14 md:w-20 md:h-20 ${selectedSauce === sauce.id ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'drop-shadow-xl'}`}>
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
