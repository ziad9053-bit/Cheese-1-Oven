"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) {
        setOrder(data);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-black font-sans" dir="rtl">
        <p className="font-bold text-gray-500">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-black font-sans" dir="rtl">
        <p className="font-bold text-red-500">لم يتم العثور على الفاتورة</p>
      </div>
    );
  }

  const shortId = String(order.id).includes('-') ? String(order.id).split('-')[0].toUpperCase() : String(order.id).toUpperCase();
  const time = new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-5 font-sans text-[#333]" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `
        body {
            background-color: #f8f9fa;
        }
        .invoice-card {
            max-width: 450px;
            background: #ffffff;
            margin: 0 auto;
            border-radius: 16px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
            padding: 24px;
            border-top: 8px solid #ff9f43;
        }
        .brand-header {
            text-align: center;
            margin-bottom: 24px;
        }
        .brand-logo {
            font-size: 28px;
            font-weight: 900;
            color: #ff9f43;
            margin: 0;
            font-family: var(--font-righteous), sans-serif;
        }
        .order-meta {
            background: #fdf8f4;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        .meta-label { color: #777; }
        .meta-value { font-weight: 700; color: #222; }
        
        .items-list {
            margin-bottom: 20px;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px dashed #eee;
        }
        .item-details {
            display: flex;
            align-items: center;
        }
        .item-qty {
            background: #ff9f43;
            color: #fff;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 20px;
            margin-left: 10px;
            font-weight: bold;
        }
        .item-name { font-weight: 700; }
        .item-price { font-weight: 900; color: #444; }

        .total-section {
            background: #333;
            color: #fff;
            padding: 16px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 18px;
            font-weight: 700;
            margin-top: 20px;
        }
        .total-price { color: #ff9f43; font-size: 22px; }
        .footer-note {
            text-align: center;
            margin-top: 24px;
            font-size: 14px;
            color: #888;
            font-weight: 700;
        }
      `}} />

      <div className="invoice-card">
          <div className="brand-header">
              <p className="brand-logo" style={{fontFamily: 'var(--font-righteous), sans-serif'}}>🧀 CHEESE 1 OVEN 🍕</p>
          </div>

          <div className="order-meta">
              <div className="meta-row">
                  <span className="meta-label">رقم الطلب:</span>
                  <span className="meta-value">#{shortId}</span>
              </div>
              <div className="meta-row">
                  <span className="meta-label">العميل:</span>
                  <span className="meta-value">{order.customer_name}</span>
              </div>
              <div className="meta-row">
                  <span className="meta-label">الوقت:</span>
                  <span className="meta-value">{time}</span>
              </div>
              <div className="meta-row">
                  <span className="meta-label">النوع:</span>
                  <span className="meta-value">{order.order_type === 'pickup' ? 'استلام من الفرع' : 'توصيل'}</span>
              </div>
              {order.notes && order.notes.includes('[PAYMENT_METHOD]') && (
                <div className="meta-row">
                    <span className="meta-label">طريقة الدفع:</span>
                    <span className="meta-value">{order.notes.match(/\[PAYMENT_METHOD\](.*?)\[\/PAYMENT_METHOD\]/)?.[1] === 'cash' ? '💵 كاش' : '💳 صرافة / بطاقة'}</span>
                </div>
              )}
          </div>

          <div className="items-list">
              {order.items?.map((item: any, idx: number) => (
                <div className="item-row" key={idx}>
                    <div className="item-details">
                      <span className="item-qty">{item.quantity}x</span>
                      <div>
                        <div className="item-name">{item.name}</div>
                        {item.sauces && item.sauces.length > 0 && (
                          <div style={{fontSize: '11px', color: '#888', marginTop: '2px'}}>+ {item.sauces.join('، ')}</div>
                        )}
                      </div>
                    </div>
                    <span className="item-price">{item.price ? (item.price * item.quantity) : '-'} ر.س</span>
                </div>
              ))}
          </div>

          <div className="total-section">
              <span>المجموع الإجمالي:</span>
              <span className="total-price">{order.total_price} ر.س</span>
          </div>

          <div className="footer-note">
              نتمنى لك وجبة شهية! ❤️
          </div>
      </div>
    </div>
  );
}
