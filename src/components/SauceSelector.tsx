"use client";

import React from 'react';
import { Sauce } from '@/lib/data';

import { Plus } from 'lucide-react';

interface Props {
  sauces: Sauce[];
  selectedSauce: number | null;
  onSelectSauce: (id: number | null) => void;
  onAddSauceToCart?: (sauce: Sauce) => void;
}

export default function SauceSelector({ sauces, selectedSauce, onSelectSauce, onAddSauceToCart }: Props) {
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
              {selectedSauce === sauce.id && onAddSauceToCart && (
                <div 
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSauceToCart(sauce);
                    // Optional: alert or visual feedback can be added here
                  }}
                  className="absolute -top-2 right-0 md:-top-3 md:-right-2 z-50 bg-red-600 hover:bg-red-500 text-white p-1 md:p-1.5 rounded-full shadow-lg border border-white transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="إضافة للسلة"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center pt-1">
              <span 
                className={`text-[12px] md:text-[14px] font-black tracking-wide text-center leading-tight transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                style={{
                  color: 'white',
                  WebkitTextStroke: '1px #FF6347'
                }}
              >
                {selectedSauce === sauce.id ? sauce.name : 'صوص'}
              </span>
              {selectedSauce === sauce.id && (
                <span className="text-[10px] md:text-[11px] text-yellow-300 font-extrabold tracking-wider leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {sauce.price} ريال
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
