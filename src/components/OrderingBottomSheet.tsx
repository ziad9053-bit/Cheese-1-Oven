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

export interface CheckoutData {
  orderType: 'pickup' | 'delivery';
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
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
  
  onCheckout?: (data: CheckoutData) => void;
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
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 250 }}
          className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col overflow-hidden"
        >
          {/* Header section with explicit back button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
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
                            {(item.product.price + item.selectedSauceIds.reduce((sum, id) => sum + (sauces.find(s => s.id === id)?.price || 0), 0)) * item.quantity} ريال
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
                            {item.drink.price * item.quantity} ريال
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
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="mb-6 space-y-3">
                      <h3 className="text-white font-bold text-lg">نوع الطلب</h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setOrderType('pickup')}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                            orderType === 'pickup' 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          🏪 استلام من المحل
                        </button>
                        <button 
                          onClick={() => setOrderType('delivery')}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                            orderType === 'delivery' 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          🛵 توصيل
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-white/70 text-sm font-bold">الاسم (إجباري)</label>
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder="الاسم الكريم..." 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-right"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-white/70 text-sm font-bold">رقم الجوال (إجباري)</label>
                        <input 
                          type="tel" 
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder="05XXXXXXXX" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-right text-left-dir"
                        />
                      </div>

                      {orderType === 'delivery' && (
                        <div className="space-y-2">
                          <label className="text-white/70 text-sm font-bold">العنوان (إجباري للتوصيل)</label>
                          <input 
                            type="text" 
                            value={customerAddress}
                            onChange={e => setCustomerAddress(e.target.value)}
                            placeholder="اسم الحي، الشارع، رقم المبنى..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-right"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-white/70 text-sm font-bold">ملاحظات (اختياري)</label>
                        <textarea 
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="أي ملاحظات إضافية على الطلب؟" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-right resize-none h-20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                      <span className="text-white/60 text-lg font-bold">الإجمالي:</span>
                      <span className="text-4xl font-black text-white">{total} <span className="text-xl text-primary">ر.س</span></span>
                    </div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 pt-4 pb-8">
          <button 
            disabled={cartItems.length === 0 && drinkCartItems.length === 0}
            onClick={() => {
              if (!customerName.trim()) {
                alert('الرجاء إدخال الاسم الكريم');
                return;
              }
              if (!customerPhone.trim()) {
                alert('الرجاء إدخال رقم الجوال');
                return;
              }
              if (orderType === 'delivery' && !customerAddress.trim()) {
                alert('الرجاء إدخال العنوان للتوصيل');
                return;
              }
              if (onCheckout) {
                onCheckout({
                  orderType,
                  customerName,
                  customerPhone,
                  customerAddress,
                  notes
                });
              }
            }}
            className="w-full bg-gradient-to-r from-primary to-rose-500 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-6 h-6" />
            إتمام الطلب
          </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
