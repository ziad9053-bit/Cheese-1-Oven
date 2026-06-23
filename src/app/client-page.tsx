"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Sauce, Drink } from '@/lib/data';
import { ProductScene } from '@/components/ProductScene';
import { KineticCarousel } from '@/components/KineticCarousel';
import { OrderingBottomSheet } from '@/components/OrderingBottomSheet';
import { ShoppingCart } from 'lucide-react';
import SauceSelector from '@/components/SauceSelector';

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

  const activeProduct = products[activeIndex];
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
  };

  const handleAddSauceToCart = (sauce: Sauce) => {
    const newItem = {
      id: Math.random().toString(36).substring(7),
      product: sauce as any, // Sauce maps directly to Product since it comes from the same DB table
      quantity: 1,
      selectedSauceIds: []
    };
    setCartItems([...cartItems, newItem]);
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
          products={products}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          cartProductIds={cartItems.map(item => item.product.id)}
        />
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsSheetOpen(true)}
        className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-[60] bg-green-500 text-white p-3.5 md:p-4 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border-2 border-white cursor-pointer"
      >
        <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
        {totalItems > 0 && (
          <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs md:text-sm font-black w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full border-2 border-black drop-shadow-md">
            {totalItems}
          </div>
        )}
      </button>

      {/* Sauce Selector Navigation Bar */}
      {activeProduct?.category_id === 1 && (
        <SauceSelector 
          sauces={sauces}
          selectedSauce={selectedSauceId}
          onSelectSauce={setSelectedSauceId}
          onAddSauceToCart={handleAddSauceToCart}
        />
      )}

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
