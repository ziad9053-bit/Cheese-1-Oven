import { supabase } from '@/lib/supabase';
import AdminClient from './AdminClient';

export const revalidate = 0;

export default async function AdminPage() {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('id'),
    supabase.from('categories').select('*').order('id'),
  ]);

  return (
    <AdminClient
      initialProducts={products ?? []}
      initialCategories={categories ?? []}
    />
  );
}
