"use client";

import React from 'react';
import RanchSauceIcon from './icons/RanchSauceIcon';
import CheeseSauceIcon from './icons/CheeseSauceIcon';
import BbqSauceIcon from './icons/BbqSauceIcon';
import JalapenoSauceIcon from './icons/JalapenoSauceIcon';

const SAUCES = [
  { id: 'ranch', name: 'رانش', component: <RanchSauceIcon className="w-8 h-8 md:w-10 md:h-10" /> },
  { id: 'cheese', name: 'جبنة', component: <CheeseSauceIcon className="w-8 h-8 md:w-10 md:h-10" /> },
  { id: 'bbq', name: 'باربيكيو', component: <BbqSauceIcon className="w-8 h-8 md:w-10 md:h-10" /> },
  { id: 'jalapeno', name: 'هالابينو', component: <JalapenoSauceIcon className="w-8 h-8 md:w-10 md:h-10" /> },
];

interface Props {
  selectedSauce: string | null;
  onSelectSauce: (id: string | null) => void;
}

export default function SauceSelector({ selectedSauce, onSelectSauce }: Props) {
  return (
    <div className="fixed bottom-6 right-6 md:right-8 z-40 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-[2rem] px-2 py-2 shadow-2xl flex items-center">
      <div className="flex items-center gap-1 md:gap-2">
        {SAUCES.map((sauce) => (
          <button
            key={sauce.id}
            onClick={() => onSelectSauce(selectedSauce === sauce.id ? null : sauce.id)}
            className={`flex flex-col items-center gap-1.5 p-2 md:px-3 md:py-2.5 rounded-3xl transition-all duration-300 ${
              selectedSauce === sauce.id 
                ? 'bg-zinc-800/80 scale-105 md:scale-110 shadow-[0_0_20px_rgba(250,204,21,0.2)] border border-primary/50' 
                : 'hover:bg-zinc-800/40 border border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`transform transition-transform duration-300 ${selectedSauce === sauce.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}>
              {sauce.component}
            </div>
            <span className={`text-[9px] md:text-[11px] font-black tracking-wide ${
              selectedSauce === sauce.id ? 'text-primary drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-white/60'
            }`}>
              {sauce.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
