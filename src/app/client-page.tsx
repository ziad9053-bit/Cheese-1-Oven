"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Sauce, Drink } from '@/lib/data';
import { ProductScene } from '@/components/ProductScene';
import { KineticCarousel } from '@/components/KineticCarousel';
import { OrderingBottomSheet } from '@/components/OrderingBottomSheet';
import { ShoppingCart } from 'lucide-react';
import AddonsMenu from '@/components/AddonsMenu';
import { playPopSound } from '@/lib/sounds';

interface Props {
  products: Product[];
  sauces: Sauce[];
  drinks: Drink[];
}

export default function ClientPage({ products, sauces, drinks }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [drinkItems, setDrinkItems] = useState<any[]>([]);
  const [selectedSauceId, setSelectedSauceId] = useState<number | null>(null);
  const [selectedSaladId, setSelectedSaladId] = useState<number | null>(null);
  const [selectedDrinkId, setSelectedDrinkId] = useState<any>(null);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const cartTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    playPopSound();
    setToastMessage(message);
    setCartPulse(true);
    
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
    
    if (cartTimer.current) clearTimeout(cartTimer.current);
    cartTimer.current = setTimeout(() => setCartPulse(false), 400);
  };

  const displayProducts = products.filter(p => p.product_type !== 'brand_settings');
  const activeProduct = displayProducts[activeIndex];
  const bgImageUrl = activeProduct?.category_id === 1 ? 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/product-images/images/bg-pizza.jpg' : 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/product-images/images/bg-pastry.jpg';

  const [loadedBg, setLoadedBg] = useState<string>(bgImageUrl);

  useEffect(() => {
    if (!bgImageUrl || bgImageUrl === loadedBg) return;
    const img = new window.Image();
    img.src = bgImageUrl;
    img.onload = () => {
      setLoadedBg(bgImageUrl);
    };
  }, [bgImageUrl, loadedBg]);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0) + drinkItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddProduct = () => {
    if (!activeProduct) return;
    
    const newItem = {
      id: Math.random().toString(36).substring(7),
      product: activeProduct,
      quantity: 1,
      selectedSauceIds: selectedSauceId ? [selectedSauceId] : []
    };
    
    setCartItems([...cartItems, newItem]);
    setSelectedSauceId(null);
    showToast(`تم إضافة ${activeProduct.name} للسلة ✅`);
  };

  const salads = products.filter(p => p.product_type === 'salad');
  const allDrinks = [...drinks, ...products.filter(p => p.product_type === 'drink')];

  const handleAddAddonToCart = (item: any, type: 'sauce' | 'salad' | 'drink') => {
    if (type === 'drink') {
      handleAddDrink(item);
      return;
    }
    const newItem = {
      id: Math.random().toString(36).substring(7),
      product: item,
      quantity: 1,
      selectedSauceIds: []
    };
    setCartItems([...cartItems, newItem]);
    showToast(`تم إضافة ${item.name} للسلة ✅`);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(items => items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const handleAddDrink = (drink: Drink) => {
    const existing = drinkItems.find(item => item.drink.id === drink.id);
    if (existing) {
      setDrinkItems(items => items.map(item => 
        item.drink.id === drink.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setDrinkItems([...drinkItems, { id: Math.random().toString(36).substring(7), drink, quantity: 1 }]);
    }
    showToast(`تم إضافة ${drink.name} للسلة ✅`);
  };

  const handleUpdateDrinkQuantity = (id: string, delta: number) => {
    setDrinkItems(items => items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveDrinkItem = (id: string) => {
    setDrinkItems(items => items.filter(item => item.id !== id));
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white flex flex-col">
      {/* Admin Button — top left */}
      <a
        href="/admin"
        className="absolute top-4 left-4 z-[100] flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 hover:border-pink-500/50 hover:bg-pink-900/20 text-white/60 hover:text-pink-300 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
        المدير
      </a>

      {/* Version badge — top right */}
      <div className="absolute top-4 right-4 z-[100] text-[10px] text-white/25 pointer-events-none select-none">
        v2.0
      </div>
      {/* Layer 0 (z-0): Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <AnimatePresence mode="popLayout">
          <motion.img 
            key={loadedBg}
            src={loadedBg}
            alt="App Background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40 z-0" />
      </div>
      
      {/* Layer 1: Central product scene */}
      <div className="absolute inset-0 pointer-events-none">
        {activeProduct ? (
          <ProductScene 
            product={activeProduct}
            onAddClick={handleAddProduct}
            bgImageUrl={bgImageUrl}
            selectedSauce={sauces.find(s => s.id === selectedSauceId) || null}
            selectedSalad={salads.find(s => s.id === selectedSaladId) || null}
            selectedDrink={allDrinks.find(d => d.id === selectedDrinkId) || null}
          />
        ) : (
          <div className="flex items-center justify-center h-full pointer-events-auto">
            <p>لا توجد منتجات حالياً</p>
          </div>
        )}
      </div>

      {/* Layer 2: Carousel ring (z-30) */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <KineticCarousel 
          products={displayProducts}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          cartProductIds={cartItems.map(item => item.product.id)}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-md border border-green-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_10px_25px_rgba(34,197,94,0.5)] whitespace-nowrap pointer-events-none flex items-center justify-center"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Identity / Logo */}
      {(() => {
        const settingsProd = products.find(p => p.product_type === 'brand_settings');
        if (!settingsProd?.description) return null;
        try {
          const settings = JSON.parse(settingsProd.description);
          if (!settings.isVisible) return null;
          return (
            <div className="absolute top-[8vh] md:top-[12vh] left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none z-30">
              <h1 
                className="w-full px-4 text-center whitespace-normal break-words leading-[0.85] text-[16vw] sm:text-[12vw] md:text-[8vw] drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                style={{
                  fontFamily: settings.font,
                  color: settings.innerColor,
                  WebkitTextStroke: `3px ${settings.outerColor}`,
                }}
              >
                {settings.text}
              </h1>
            </div>
          );
        } catch(e) { return null; }
      })()}

      {/* Bottom Bar Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 md:bottom-10 z-[60] flex items-end justify-between pointer-events-none" dir="rtl">
        {/* Right side: Addons Menu */}
        <div className={`pointer-events-auto flex justify-end shrink min-w-0 overflow-visible transition-all duration-500 ${isAddonsExpanded ? 'w-full' : ''}`}>
          {activeProduct?.category_id === 1 && (
            <AddonsMenu 
              sauces={sauces}
              salads={salads}
              drinks={allDrinks}
              selectedSauce={selectedSauceId}
              onSelectSauce={setSelectedSauceId}
              selectedSalad={selectedSaladId}
              onSelectSalad={setSelectedSaladId}
              selectedDrink={selectedDrinkId}
              onSelectDrink={setSelectedDrinkId}
              onAddToCart={handleAddAddonToCart}
              onExpandedChange={setIsAddonsExpanded}
            />
          )}
        </div>

        {/* Left side: Cart Button */}
        <div 
          className={`pointer-events-auto z-[65] transition-all duration-500 absolute left-4 md:left-4 ${
            isAddonsExpanded ? 'bottom-[120%] md:bottom-[150%]' : 'bottom-0'
          }`}
        >
          <button
            onClick={() => setIsSheetOpen(true)}
            className={`text-white flex items-center justify-center border border-white/30 backdrop-blur-xl cursor-pointer transition-all duration-500 ${
              isAddonsExpanded 
                ? 'w-10 h-10 md:w-12 md:h-12 rounded-full p-0 shadow-[0_4px_15px_rgba(0,0,0,0.5)]' 
                : 'px-4 md:px-6 py-2 md:py-2.5 rounded-full gap-2 min-w-[70px] md:min-w-[90px]'
            } ${
              cartPulse 
                ? 'scale-110 bg-green-500/80 shadow-[0_0_40px_rgba(34,197,94,1)]' 
                : 'hover:scale-105 active:scale-95 bg-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
            }`}
          >
            <ShoppingCart className={isAddonsExpanded ? "w-4 h-4 md:w-5 md:h-5" : "w-5 h-5 md:w-6 md:h-6"} />
            <span className={`font-bold text-xs md:text-sm overflow-hidden transition-all duration-500 whitespace-nowrap ${
              isAddonsExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
            }`}>السلة</span>
            {totalItems > 0 && (
              <div className={`absolute -top-2 -right-2 bg-pink-500 text-white font-black flex items-center justify-center rounded-full border-2 border-black drop-shadow-md transition-all duration-500 ${
                isAddonsExpanded ? 'text-[9px] md:text-[10px] w-5 h-5 md:w-5 md:h-5 -top-1 -right-1' : 'text-xs md:text-sm w-6 h-6 md:w-7 md:h-7'
              }`}>
                {totalItems}
              </div>
            )}
          </button>
        </div>
      </div>

      <OrderingBottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        sauces={sauces}
        drinkCartItems={drinkItems}
        onUpdateDrinkQuantity={handleUpdateDrinkQuantity}
        onRemoveDrinkItem={handleRemoveDrinkItem}
        drinks={drinks}
        onAddDrink={handleAddDrink}
        onCheckout={() => {
          alert('تم استلام طلبك بنجاح!');
          setCartItems([]);
          setDrinkItems([]);
          setIsSheetOpen(false);
        }}
      />
    </main>
  );
}
