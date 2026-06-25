"use client";

import React from 'react';
import { Package, Home } from 'lucide-react';

export default function DriverPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.location.href = '/'}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="العودة للصفحة الرئيسية"
        >
          <Home size={24} />
        </button>
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Package size={24} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black">لوحة تحكم السائق</h1>
          <p className="text-white/50 text-sm">نظام توصيل الطلبات للعملاء</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
        <div className="text-center space-y-4">
          <Package size={48} className="text-white/20 mx-auto" />
          <h2 className="text-xl font-bold text-white/50">سيتم تفعيل نظام التوصيل قريباً</h2>
          <p className="text-sm text-white/30 max-w-sm mx-auto">
            هذه الشاشة ستعرض الطلبات الجاهزة وعناوين العملاء ليقوم السائق بتوصيلها.
          </p>
        </div>
      </div>
    </div>
  );
}
