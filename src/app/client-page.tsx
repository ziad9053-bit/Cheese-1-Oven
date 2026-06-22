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
  const bgImageUrl = activeProduct?.category_id === 1 ? 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/images/bg-pizza.jpg' : 'https://ubezqecpelddbwapffmn.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/images/bg-pastry.jpg';

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
      <div className="absolute top-4 right-4 z-[100] text-xs text-white/50 bg-black/50 px-2 py-1 rounded-full pointer-events-none">
        v1.5 (محترف)
      </div>
      
      {/* Layer 1 (z-10): Background + central pizza image */}
      <div className="absolute inset-0 z-10 pointer-events-none">
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

      {/* Layer 2 (z-20): Circular thumbnail ring — clickable pizza circles */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <KineticCarousel 
          products={products}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
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
