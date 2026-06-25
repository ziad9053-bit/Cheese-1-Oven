"use client";

import React, { useState } from 'react';
import { Sauce, Product, Drink } from '@/lib/data';
import { Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  sauces: Sauce[];
  salads: Product[];
  drinks: any[]; // or Product[] if we unify, let's accept both for now
  selectedSauce: number | null;
  onSelectSauce: (id: number | null) => void;
  selectedSalad: number | null;
  onSelectSalad: (id: number | null) => void;
  selectedDrink: any;
  onSelectDrink: (id: any) => void;
  onAddToCart: (item: any, type: 'sauce' | 'salad' | 'drink') => void;
}

type Category = 'sauces' | 'salads' | 'drinks';

export default function AddonsMenu({ 
  sauces, salads, drinks,
  selectedSauce, onSelectSauce,
  selectedSalad, onSelectSalad,
  selectedDrink, onSelectDrink,
  onAddToCart
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const renderCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'sauces': return <img src="https://emojigraph.org/media/apple/drop-of-blood_1fa78.png" className="w-5 h-5 md:w-6 md:h-6 opacity-80 filter hue-rotate-90 drop-shadow-md" alt="صوص" />;
      case 'salads': return <span className="text-lg md:text-xl drop-shadow-md">🥗</span>;
      case 'drinks': return <span className="text-lg md:text-xl drop-shadow-md">🥤</span>;
    }
  };

  const getItems = (cat: Category): any[] => {
    switch (cat) {
      case 'sauces': return sauces.filter(s => s.is_available);
      case 'salads': return salads.filter(s => s.is_available);
      case 'drinks': return drinks;
    }
  };

  const getSelectedId = (cat: Category) => {
    switch (cat) {
      case 'sauces': return selectedSauce;
      case 'salads': return selectedSalad;
      case 'drinks': return selectedDrink;
    }
  };

  const onSelect = (cat: Category, id: number | null) => {
    switch (cat) {
      case 'sauces': onSelectSauce(id); break;
      case 'salads': onSelectSalad(id); break;
      case 'drinks': onSelectDrink(id); break;
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 md:bottom-10 z-[55] flex justify-end" dir="rtl">
      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div 
            key="main-buttons"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="flex gap-2 md:gap-3"
          >
            {(['sauces', 'salads', 'drinks'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center justify-center bg-white/15 backdrop-blur-xl border border-white/30 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/25 transition-all hover:scale-105 active:scale-95 min-w-[70px] md:min-w-[90px]"
              >
                <span className="font-bold text-xs md:text-sm">
                  {cat === 'sauces' ? 'صوصات' : cat === 'salads' ? 'سلطات' : 'مشروبات'}
                </span>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="expanded-row"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex items-center gap-2 md:gap-4 bg-white/15 backdrop-blur-xl border border-white/30 p-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-max max-w-full"
          >
            {/* Back Arrow */}
            <button 
              onClick={() => setActiveCategory(null)}
              className="w-10 h-10 md:w-12 md:h-12 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-transform hover:scale-110 active:scale-95 shrink-0 ml-1"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
            </button>

            {/* Items Row */}
            <div className="flex items-center -space-x-3 space-x-reverse md:-space-x-4 px-2 overflow-x-auto hide-scrollbar scroll-smooth">
              {getItems(activeCategory).map((item: any) => {
                const isSelected = getSelectedId(activeCategory) === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(activeCategory, isSelected ? null : item.id)}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 w-16 md:w-20 shrink-0 ${
                      isSelected 
                        ? 'z-20 -translate-y-3' 
                        : 'z-0 opacity-80 hover:opacity-100 hover:-translate-y-2 hover:z-10'
                    }`}
                  >
                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-black/20 rounded-full border border-white/5 drop-shadow-lg p-1">
                      <div className={`w-full h-full rounded-full overflow-hidden ${isSelected ? 'sauce-active' : 'sauce-idle'}`}>
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-contain drop-shadow-md"
                        />
                      </div>
                      {isSelected && (
                        <div 
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const typeMap = { sauces: 'sauce', salads: 'salad', drinks: 'drink' } as const;
                            onAddToCart(item, typeMap[activeCategory as Category]);
                          }}
                          className="absolute -top-2 right-0 md:-top-2 md:-right-1 z-50 bg-red-600 hover:bg-red-500 text-white p-1 md:p-1.5 rounded-full shadow-lg border border-white transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
                          title="إضافة للسلة"
                        >
                          <Plus className="w-4 h-4" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center pt-1">
                      <span 
                        className={`text-[10px] md:text-[12px] font-black tracking-wide text-center leading-tight transition-all duration-300`}
                        style={{
                          color: 'white',
                          WebkitTextStroke: isSelected ? '0.5px rgba(0,0,0,0.8)' : '1px rgba(0,0,0,0.8)',
                          textShadow: isSelected ? '0 2px 4px rgba(0,0,0,1)' : '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                  </button>
                );
              })}
              {getItems(activeCategory).length === 0 && (
                <div className="text-white/50 text-sm px-4 whitespace-nowrap py-2">لا توجد أصناف حالياً</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
