"use client";

import React from 'react';
import RanchSauceIcon from './icons/RanchSauceIcon';
import CheeseSauceIcon from './icons/CheeseSauceIcon';
import BbqSauceIcon from './icons/BbqSauceIcon';
import JalapenoSauceIcon from './icons/JalapenoSauceIcon';

const SAUCES = [
  { id: 'ranch', name: 'رانش', component: <RanchSauceIcon className="w-12 h-12 md:w-16 md:h-16" /> },
  { id: 'cheese', name: 'جبنة', component: <CheeseSauceIcon className="w-12 h-12 md:w-16 md:h-16" /> },
  { id: 'bbq', name: 'باربيكيو', component: <BbqSauceIcon className="w-12 h-12 md:w-16 md:h-16" /> },
  { id: 'jalapeno', name: 'هالابينو', component: <JalapenoSauceIcon className="w-12 h-12 md:w-16 md:h-16" /> },
];

interface Props {
  selectedSauce: string | null;
  onSelectSauce: (id: string | null) => void;
}

export default function SauceSelector({ selectedSauce, onSelectSauce }: Props) {
  return (
    <div className="fixed bottom-6 right-6 md:right-8 z-40 flex items-center">
      <div className="flex items-center gap-3 md:gap-5">
        {SAUCES.map((sauce) => (
          <button
            key={sauce.id}
            onClick={() => onSelectSauce(selectedSauce === sauce.id ? null : sauce.id)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
              selectedSauce === sauce.id 
                ? 'scale-125' 
                : 'opacity-70 hover:opacity-100 hover:scale-110'
            }`}
          >
            <div className={`transform transition-transform duration-300 ${selectedSauce === sauce.id ? 'drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]' : 'drop-shadow-lg'}`}>
              {sauce.component}
            </div>
            <span className={`text-[11px] md:text-[13px] font-black tracking-wide ${
              selectedSauce === sauce.id 
                ? 'text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' 
                : 'text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
            }`}>
              {sauce.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
