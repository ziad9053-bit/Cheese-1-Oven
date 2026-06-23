"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Trash2, ShoppingBag, Plus, Minus, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { Product, Sauce, Drink } from '@/lib/data';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSauceIds: number[];
}

interface DrinkCartItem {
  id: string;
  drink: Drink;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  sauces: Sauce[];
  
  drinkCartItems?: DrinkCartItem[];
  onUpdateDrinkQuantity?: (id: string, delta: number) => void;
  onRemoveDrinkItem?: (id: string) => void;
  drinks?: Drink[];
  onAddDrink?: (drink: Drink) => void;
  
  onCheckout?: () => void;
}

export const OrderingBottomSheet: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  sauces,
  drinkCartItems = [],
  onUpdateDrinkQuantity = () => {},
  onRemoveDrinkItem = () => {},
  drinks = [],
  onAddDrink = () => {},
  onCheckout
}) => {
  const productsTotal = cartItems.reduce((total, item) => {
    const productPrice = item.product.price;
    const saucesPrice = item.selectedSauceIds.reduce((sum, sauceId) => {
      const sauce = sauces.find(s => s.id === sauceId);
      return sum + (sauce?.price || 0);
    }, 0);
    return total + ((productPrice + saucesPrice) * item.quantity);
  }, 0);

  const drinksTotal = drinkCartItems.reduce((total, item) => {
    return total + (item.drink.price * item.quantity);
  }, 0);

  const total = productsTotal + drinksTotal;

  const getRecommendedDrink = () => {
    if (cartItems.length === 0 || drinks.length === 0) return null;
    const lastItem = cartItems[cartItems.length - 1].product.name;
    if (lastItem.includes("بيتزا")) {
      return drinks.find(d => d.name.includes("بيبسي")) || drinks[0];
    }
    return drinks.length > 1 ? drinks[1] : drinks[0];
  };

  const recommendedDrink = getRecommendedDrink();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 h-[85vh] bg-zinc-950 border-t border-white/10 rounded-t-[32px] z-50 flex flex-col overflow-hidden"
      >
        {/* Header section with explicit back button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-bold text-xs md:text-sm">العودة للواجهة</span>
          </button>
          
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            السلة
          </h2>
          
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {cartItems.length + drinkCartItems.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-24 pt-6 scrollbar-none">
          <div className="space-y-4">
            <AnimatePresence>
              {cartItems.length === 0 && drinkCartItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-white/40"
                >
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                  <p>سلتك فارغة، أضف بعض المنتجات الشهية!</p>
                </motion.div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4"
                    >
                      <div className="w-20 h-20 bg-black/40 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 object-contain drop-shadow-lg" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold text-lg">{item.product.name}</h3>
                            <button onClick={() => onRemoveItem(item.id)} className="text-white/40 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {item.selectedSauceIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedSauceIds.map(sauceId => {
                                const sauce = sauces.find(s => s.id === sauceId);
                                return sauce ? (
                                  <span key={sauceId} className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-md">
                                    + {sauce.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-primary font-black text-lg">
                            {(item.product.price + item.selectedSauceIds.reduce((sum, id) => sum + (sauces.find(s => s.id === id)?.price || 0), 0)) * item.quantity} ر.س
                          </span>
                          
                          <div className="flex items-center gap-3 bg-black/40 rounded-full px-1 py-1 border border-white/10">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white font-bold min-w-[12px] text-center text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] active:scale-95 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {drinkCartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4"
                    >
                      <div className="w-20 h-20 bg-blue-500/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-blue-500/20">
                         <span className="text-3xl">🥤</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold text-lg">{item.drink.name}</h3>
                            <button onClick={() => onRemoveDrinkItem(item.id)} className="text-white/40 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-blue-400 font-black text-lg">
                            {item.drink.price * item.quantity} ر.س
                          </span>
                          
                          <div className="flex items-center gap-3 bg-black/40 rounded-full px-1 py-1 border border-white/10">
                            <button 
                              onClick={() => onUpdateDrinkQuantity(item.id, -1)}
                              className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white font-bold min-w-[12px] text-center text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateDrinkQuantity(item.id, 1)}
                              className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] active:scale-95 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {cartItems.length > 0 && recommendedDrink && !drinkCartItems.some(d => d.drink.id === recommendedDrink.id) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">اقتراح الذكاء الاصطناعي</span>
                  </div>
                  <h4 className="text-white font-bold mb-1">ما يكمل طلبك بدون مشروب بارد؟</h4>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">🥤</div>
                      <div>
                        <p className="text-white font-bold">{recommendedDrink.name}</p>
                        <p className="text-blue-300 text-sm">{recommendedDrink.price} ر.س</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onAddDrink(recommendedDrink)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 pt-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60">الإجمالي</span>
            <span className="text-3xl font-black text-white">{total} <span className="text-lg text-primary">ر.س</span></span>
          </div>
          
          <button 
            disabled={cartItems.length === 0 && drinkCartItems.length === 0}
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-primary to-rose-500 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-6 h-6" />
            إتمام الطلب
          </button>
        </div>
      </motion.div>
    </>
  );
};
