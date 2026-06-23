import { supabase } from '@/lib/supabase';
import ClientPage from './client-page';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0; // Disable caching for now to always get fresh data

export default async function Home() {
  const { data: products } = await supabase.from('products').select('*');
  const { data: drinks } = await supabase.from('drinks').select('*');

  return (
    <ClientPage 
      products={products?.filter(p => p.product_type !== 'sauce') || []} 
      sauces={products?.filter(p => p.product_type === 'sauce') || []} 
      drinks={drinks || []} 
    />
  );
}
