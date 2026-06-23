import { supabase } from '@/lib/supabase';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const [{ data: products }, { data: categories }, { data: sauces }] = await Promise.all([
    supabase.from('products').select('*').order('id'),
    supabase.from('categories').select('*').order('id'),
    supabase.from('sauces').select('*').order('created_at'),
  ]);

  return (
    <AdminClient
      initialProducts={products ?? []}
      initialCategories={categories ?? []}
      initialSauces={sauces ?? []}
    />
  );
}
