import { supabase } from '@/lib/supabase';
import { Product, Order } from '@/lib/data';

export const revalidate = 0;

export default async function AdminPage() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 overflow-y-auto">
      <h1 className="text-3xl font-black mb-8 text-primary">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">أحدث الطلبات</h2>
          {(!orders || orders.length === 0) ? (
            <p className="text-white/50 text-sm">لا توجد طلبات بعد.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="bg-black/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="font-bold">طلب #{order.id}</p>
                    <p className="text-sm text-white/50">{new Date(order.created_at).toLocaleString('ar-SA')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-primary font-black">{order.total_price} ر.س</p>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{order.status || 'قيد الانتظار'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">المنتجات الحالية</h2>
          {(!products || products.length === 0) ? (
            <p className="text-white/50 text-sm">لا توجد منتجات.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product: Product) => (
                <div key={product.id} className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-white/5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm text-primary font-black">{product.price} ر.س</p>
                  </div>
                  <div className="text-xs text-white/50">
                    نوع: {product.product_type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
