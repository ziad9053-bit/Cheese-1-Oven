"use client";

import React, { useState } from 'react';
import { Product, Sauce, Drink } from '@/lib/data';
import { ProductScene } from '@/components/ProductScene';
import { KineticCarousel } from '@/components/KineticCarousel';
import { OrderingBottomSheet } from '@/components/OrderingBottomSheet';

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
  const [selectedSauceIds, setSelectedSauceIds] = useState<string[]>([]);

  const activeProduct = products[activeIndex];
  const bgImageUrl = activeProduct?.category_id === 1 ? 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/product-images/images/bg-pizza.jpg' : 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/product-images/images/bg-pastry.jpg';

  const handleAddSauce = (sauce: Sauce) => {
    if (selectedSauceIds.includes(sauce.id)) {
      setSelectedSauceIds(selectedSauceIds.filter(id => id !== sauce.id));
    } else {
      setSelectedSauceIds([...selectedSauceIds, sauce.id]);
    }
  };

  const handleAddProduct = () => {
    if (!activeProduct) return;
    
    const newItem = {
      id: Math.random().toString(36).substring(7),
      product: activeProduct,
      quantity: 1,
      selectedSauceIds: [...selectedSauceIds]
    };
    
    setCartItems([...cartItems, newItem]);
    setSelectedSauceIds([]);
    setIsSheetOpen(true);
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
      
      {/* Layer 1 (z-10): Background + pizza image — pointer-events-auto so sauce/add buttons work */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        {activeProduct ? (
          <ProductScene 
            product={activeProduct}
            bgImageUrl={bgImageUrl}
            sauces={sauces}
            selectedSauceIds={selectedSauceIds}
            onAddSauce={handleAddSauce}
            onAddClick={handleAddProduct}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>لا توجد منتجات حالياً</p>
          </div>
        )}
      </div>

      {/* Layer 2 (z-20): Carousel ring — pointer-events-none on wrapper; KineticCarousel handles its own internally */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <KineticCarousel 
          products={products}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          cartProductIds={cartItems.map(item => item.product.id)}
        />
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
