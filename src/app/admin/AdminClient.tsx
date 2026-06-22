"use client";

import React, { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Pencil, Trash2, Upload, Image, RefreshCw,
  ChevronDown, Check, X, Loader2, ImagePlus, FileImage,
  LayoutDashboard, Package, Layers, Settings, LogOut,
  Eye, EyeOff, BarChart3, Palette, ArrowUpDown
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  product_type: string;
  is_available: boolean;
}
interface Category { id: number; name: string; slug: string; }

// ── Image utilities ───────────────────────────────────────────────────────────
async function resizeAndConvert(
  file: File,
  maxW: number,
  maxH: number,
  quality = 0.88
): Promise<{ blob: Blob; webpUrl: string; originalSize: number; newSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Failed to convert'));
            resolve({
              blob,
              webpUrl: URL.createObjectURL(blob),
              originalSize: file.size,
              newSize: blob.size,
            });
          },
          'image/webp',
          quality
        );
      };
    };
    reader.readAsDataURL(file);
  });
}

// ── Sidebar Nav ───────────────────────────────────────────────────────────────
type Section = 'dashboard' | 'products' | 'categories' | 'images';

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'لوحة التحكم', icon: <LayoutDashboard size={18} /> },
  { id: 'products',   label: 'المنتجات',     icon: <Package size={18} /> },
  { id: 'categories', label: 'الأصناف',      icon: <Layers size={18} /> },
  { id: 'images',     label: 'إدارة الصور',  icon: <Image size={18} /> },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'ok'|'err'; onClose: ()=>void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border text-sm font-bold transition-all
      ${type === 'ok' ? 'bg-green-950 border-green-500/40 text-green-300' : 'bg-red-950 border-red-500/40 text-red-300'}`}>
      {type === 'ok' ? <Check size={16} /> : <X size={16} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Image Processor Tool ──────────────────────────────────────────────────────
function ImageProcessor({ onDone }: { onDone: (url: string) => void }) {
  const [state, setState] = useState<{
    preview: string | null;
    webpUrl: string | null;
    origSize: number;
    newSize: number;
    loading: boolean;
    fileName: string;
  }>({ preview: null, webpUrl: null, origSize: 0, newSize: 0, loading: false, fileName: '' });

  const [maxW, setMaxW] = useState(800);
  const [maxH, setMaxH] = useState(800);
  const [quality, setQuality] = useState(88);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setState(s => ({ ...s, loading: true, preview: URL.createObjectURL(f), fileName: f.name }));
    try {
      const result = await resizeAndConvert(f, maxW, maxH, quality / 100);
      setState(s => ({ ...s, loading: false, webpUrl: result.webpUrl, origSize: result.originalSize, newSize: result.newSize }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  };

  const fmt = (n: number) => n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
      <h3 className="text-base font-black flex items-center gap-2 text-white">
        <FileImage size={18} className="text-pink-400" />
        معالج الصور — تحويل إلى WebP + تصغير الحجم
      </h3>

      {/* Settings row */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <label className="space-y-1">
          <span className="text-white/50 text-xs">الحد الأقصى للعرض (px)</span>
          <input type="number" value={maxW} onChange={e => setMaxW(+e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-pink-500" />
        </label>
        <label className="space-y-1">
          <span className="text-white/50 text-xs">الحد الأقصى للارتفاع (px)</span>
          <input type="number" value={maxH} onChange={e => setMaxH(+e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-pink-500" />
        </label>
        <label className="space-y-1">
          <span className="text-white/50 text-xs">جودة WebP (1-100)</span>
          <input type="number" value={quality} min={1} max={100} onChange={e => setQuality(+e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-pink-500" />
        </label>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <ImagePlus size={28} className="mx-auto text-white/30 mb-2" />
        <p className="text-white/50 text-sm">اسحب الصورة هنا أو انقر للاختيار</p>
        <p className="text-white/30 text-xs mt-1">PNG, JPG, JPEG, WebP</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* Result */}
      {state.loading && (
        <div className="flex items-center gap-2 text-pink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> جاري المعالجة...
        </div>
      )}

      {state.webpUrl && !state.loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-white/50">الأصل</p>
            <img src={state.preview!} alt="original" className="w-full h-40 object-contain bg-black/30 rounded-xl border border-white/10" />
            <p className="text-xs text-white/40 text-center">{fmt(state.origSize)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-green-400">بعد التحويل</p>
            <img src={state.webpUrl} alt="webp" className="w-full h-40 object-contain bg-black/30 rounded-xl border border-green-500/20" />
            <p className="text-xs text-green-400 text-center">
              {fmt(state.newSize)} ({Math.round((1 - state.newSize / state.origSize) * 100)}% توفير)
            </p>
          </div>
        </div>
      )}

      {state.webpUrl && (
        <div className="flex gap-3">
          <a href={state.webpUrl} download={`${state.fileName.replace(/\.[^.]+$/, '')}.webp`}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
            <Upload size={15} /> تحميل WebP
          </a>
          <button onClick={() => onDone(state.webpUrl!)}
            className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
            <Check size={15} /> استخدام هذه الصورة
          </button>
        </div>
      )}
    </div>
  );
}

// ── Upload to Supabase Storage ─────────────────────────────────────────────────
async function uploadToStorage(blob: Blob, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('PRODUCT-IMAGES')
    .upload(path, blob, { contentType: 'image/webp', upsert: true });
  if (error || !data) return null;
  const { data: urlData } = supabase.storage.from('PRODUCT-IMAGES').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ── Product Form ───────────────────────────────────────────────────────────────
function ProductForm({
  initial, categories, onSave, onCancel,
}: {
  initial?: Product;
  categories: Category[];
  onSave: (p: Partial<Product>, imageBlob?: Blob) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(initial ?? {
    name: '', description: '', price: 0,
    image_url: '', category_id: categories[0]?.id ?? 1,
    product_type: 'pizza', is_available: true,
  });
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initial?.image_url ?? '');
  const [showProcessor, setShowProcessor] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Product, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleProcessorDone = (url: string) => {
    setImagePreview(url);
    fetch(url).then(r => r.blob()).then(b => setImageBlob(b));
    setShowProcessor(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form, imageBlob ?? undefined);
    setSaving(false);
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="font-black text-lg text-white">{initial ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">اسم المنتج</span>
          <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
            placeholder="مثال: بيتزا مرغريتا" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">السعر (ر.س)</span>
          <input type="number" value={form.price ?? 0} onChange={e => set('price', +e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">الصنف</span>
          <select value={form.category_id ?? ''} onChange={e => set('category_id', +e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">نوع المنتج</span>
          <select value={form.product_type ?? 'pizza'} onChange={e => set('product_type', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm">
            <option value="pizza">بيتزا</option>
            <option value="pastry">معجنات</option>
            <option value="drink">مشروبات</option>
            <option value="side">إضافات</option>
          </select>
        </label>
        <label className="md:col-span-2 space-y-1.5">
          <span className="text-xs text-white/50">الوصف</span>
          <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
            rows={2} placeholder="وصف مختصر للمنتج..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm resize-none" />
        </label>
      </div>

      {/* Image section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">صورة المنتج</span>
          <button onClick={() => setShowProcessor(!showProcessor)}
            className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors">
            <ImagePlus size={13} />
            {showProcessor ? 'إخفاء معالج الصور' : 'فتح معالج الصور'}
          </button>
        </div>

        {showProcessor && <ImageProcessor onDone={handleProcessorDone} />}

        {imagePreview ? (
          <div className="relative w-full h-40 bg-black/30 rounded-xl border border-white/10 overflow-hidden">
            <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
            <button onClick={() => { setImagePreview(''); setImageBlob(null); set('image_url', ''); }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/80 border border-white/10 rounded-full p-1 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <input value={form.image_url ?? ''} onChange={e => { set('image_url', e.target.value); setImagePreview(e.target.value); }}
            placeholder="https://... (رابط الصورة)"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm" />
        )}
      </div>

      {/* availability */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => set('is_available', !form.is_available)}
          className={`w-11 h-6 rounded-full transition-colors relative ${form.is_available ? 'bg-pink-600' : 'bg-white/10'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-white/70">متاح للطلب</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
          {saving ? <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</> : <><Check size={15} /> حفظ</>}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-bold text-sm transition-colors border border-white/10">
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ── Category Form ─────────────────────────────────────────────────────────────
function CategoryForm({ initial, onSave, onCancel }: {
  initial?: Category;
  onSave: (c: Partial<Category>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Category>>(initial ?? { name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white">{initial ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">اسم الصنف</span>
          <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="مثال: بيتزا"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-white/50">الرمز (slug)</span>
          <input value={form.slug ?? ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="pizza"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm" />
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} حفظ
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-bold text-sm border border-white/10 transition-colors">إلغاء</button>
      </div>
    </div>
  );
}

// ── Background Manager ─────────────────────────────────────────────────────────
function BackgroundManager({ onToast }: { onToast: (m: string, t: 'ok'|'err') => void }) {
  const [bgBlob, setBgBlob] = useState<Blob | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const [bgType, setBgType] = useState<'pizza' | 'pastry'>('pizza');
  const [uploading, setUploading] = useState(false);
  const [showProcessor, setShowProcessor] = useState(false);

  const handleProcessorDone = (url: string) => {
    setBgPreview(url);
    fetch(url).then(r => r.blob()).then(b => setBgBlob(b));
    setShowProcessor(false);
  };

  const handleUpload = async () => {
    if (!bgBlob) return onToast('الرجاء معالجة صورة أولاً', 'err');
    setUploading(true);
    const path = `images/bg-${bgType}.jpg`;
    const url = await uploadToStorage(bgBlob, path);
    setUploading(false);
    if (url) onToast(`✅ تم رفع خلفية ${bgType === 'pizza' ? 'البيتزا' : 'المعجنات'} بنجاح`, 'ok');
    else onToast('فشل رفع الخلفية', 'err');
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="font-black text-white flex items-center gap-2">
        <Palette size={18} className="text-pink-400" />
        إدارة الخلفيات
      </h3>
      <div className="flex gap-3">
        {(['pizza', 'pastry'] as const).map(t => (
          <button key={t} onClick={() => setBgType(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${bgType === t ? 'border-pink-500 bg-pink-600/20 text-pink-300' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
            {t === 'pizza' ? '🍕 خلفية البيتزا' : '🥐 خلفية المعجنات'}
          </button>
        ))}
      </div>

      <button onClick={() => setShowProcessor(!showProcessor)}
        className="w-full flex items-center justify-center gap-2 text-xs text-pink-400 hover:text-pink-300 border border-pink-500/20 rounded-xl py-2 transition-colors">
        <ImagePlus size={13} />
        {showProcessor ? 'إخفاء معالج الصور' : 'فتح معالج الصور (مقترح: 1920×1080)'}
      </button>

      {showProcessor && (
        <ImageProcessor onDone={handleProcessorDone} />
      )}

      {bgPreview && (
        <div className="relative h-40 rounded-xl overflow-hidden border border-white/10">
          <img src={bgPreview} className="w-full h-full object-cover" alt="bg preview" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-xs text-white/70 bg-black/60 px-3 py-1 rounded-full">معاينة الخلفية</span>
          </div>
        </div>
      )}

      <button onClick={handleUpload} disabled={!bgBlob || uploading}
        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'جاري الرفع...' : `رفع خلفية ${bgType === 'pizza' ? 'البيتزا' : 'المعجنات'}`}
      </button>
    </div>
  );
}

// ── Main Admin Client ─────────────────────────────────────────────────────────
export default function AdminClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [section, setSection]       = useState<Section>('dashboard');
  const [products, setProducts]     = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [editProduct, setEditProduct]     = useState<Product | null>(null);
  const [addProduct, setAddProduct]       = useState(false);
  const [editCategory, setEditCategory]   = useState<Category | null>(null);
  const [addCategory, setAddCategory]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product'|'category'; id: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string, type: 'ok'|'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Product CRUD ────────────────────────────────────────────────────────────
  const saveProduct = async (data: Partial<Product>, imageBlob?: Blob) => {
    let imageUrl = data.image_url;
    if (imageBlob) {
      const path = `images/products/${Date.now()}.webp`;
      const url = await uploadToStorage(imageBlob, path);
      if (url) imageUrl = url;
      else return showToast('فشل رفع الصورة', 'err');
    }
    const payload = { ...data, image_url: imageUrl };
    if (data.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', data.id);
      if (error) return showToast('فشل التعديل: ' + error.message, 'err');
      setProducts(ps => ps.map(p => p.id === data.id ? { ...p, ...payload } as Product : p));
      showToast('تم تعديل المنتج بنجاح ✅', 'ok');
    } else {
      const { data: inserted, error } = await supabase.from('products').insert([payload]).select().single();
      if (error || !inserted) return showToast('فشل الإضافة: ' + error?.message, 'err');
      setProducts(ps => [...ps, inserted as Product]);
      showToast('تمت إضافة المنتج بنجاح ✅', 'ok');
    }
    setEditProduct(null);
    setAddProduct(false);
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return showToast('فشل الحذف', 'err');
    setProducts(ps => ps.filter(p => p.id !== id));
    showToast('تم حذف المنتج', 'ok');
    setConfirmDelete(null);
  };

  // ── Category CRUD ───────────────────────────────────────────────────────────
  const saveCategory = async (data: Partial<Category>) => {
    if (data.id) {
      const { error } = await supabase.from('categories').update(data).eq('id', data.id);
      if (error) return showToast('فشل التعديل', 'err');
      setCategories(cs => cs.map(c => c.id === data.id ? { ...c, ...data } as Category : c));
      showToast('تم تعديل الصنف ✅', 'ok');
    } else {
      const { data: ins, error } = await supabase.from('categories').insert([data]).select().single();
      if (error || !ins) return showToast('فشل الإضافة: ' + error?.message, 'err');
      setCategories(cs => [...cs, ins as Category]);
      showToast('تمت إضافة الصنف ✅', 'ok');
    }
    setEditCategory(null);
    setAddCategory(false);
  };

  const deleteCategory = async (id: number) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return showToast('فشل الحذف', 'err');
    setCategories(cs => cs.filter(c => c.id !== id));
    showToast('تم حذف الصنف', 'ok');
    setConfirmDelete(null);
  };

  // ── Dashboard stats ──────────────────────────────────────────────────────────
  const stats = [
    { label: 'إجمالي المنتجات', value: products.length, color: 'text-pink-400' },
    { label: 'متاحة للطلب', value: products.filter(p => p.is_available).length, color: 'text-green-400' },
    { label: 'الأصناف', value: categories.length, color: 'text-blue-400' },
    { label: 'غير متاحة', value: products.filter(p => !p.is_available).length, color: 'text-red-400' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-950 text-white flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-black/50 border-l border-white/8 flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-white/8">
          <p className="text-xs text-white/40 font-medium">لوحة تحكم</p>
          <h1 className="text-lg font-black text-white mt-0.5">Cheese 1 Oven</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                section === item.id
                  ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/8">
          <a href="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowUpDown size={16} /> العودة للتطبيق
          </a>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 space-y-8">

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">لوحة التحكم الرئيسية</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
                  <div key={s.label} className="bg-zinc-900 border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-white/40 mb-1">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-zinc-900 border border-white/8 rounded-2xl p-5">
                <h3 className="font-bold mb-4 text-white/70 text-sm">المنتجات الأخيرة</h3>
                <div className="space-y-2">
                  {products.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                      {p.image_url && <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-full object-cover" />}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="text-xs text-white/40">{p.product_type}</p>
                      </div>
                      <p className="text-sm font-black text-pink-400">{p.price} ر.س</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {p.is_available ? 'متاح' : 'غير متاح'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {section === 'products' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">إدارة المنتجات</h2>
                <button onClick={() => { setAddProduct(true); setEditProduct(null); }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Plus size={16} /> إضافة منتج
                </button>
              </div>

              {(addProduct) && (
                <ProductForm categories={categories} onSave={saveProduct} onCancel={() => setAddProduct(false)} />
              )}
              {editProduct && (
                <ProductForm initial={editProduct} categories={categories} onSave={saveProduct} onCancel={() => setEditProduct(null)} />
              )}

              <div className="space-y-3">
                {products.map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/15 transition-colors">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-black/40 shrink-0" />
                      : <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center shrink-0 text-xl">🍕</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white truncate">{p.name}</p>
                      <p className="text-xs text-white/40 truncate">{p.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{p.product_type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {p.is_available ? 'متاح' : 'غير متاح'}
                        </span>
                      </div>
                    </div>
                    <p className="font-black text-pink-400 shrink-0">{p.price} ر.س</p>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditProduct(p); setAddProduct(false); }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-blue-900/40 hover:text-blue-300 text-white/50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: 'product', id: p.id })}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-900/40 hover:text-red-300 text-white/50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {section === 'categories' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">إدارة الأصناف</h2>
                <button onClick={() => { setAddCategory(true); setEditCategory(null); }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Plus size={16} /> إضافة صنف
                </button>
              </div>

              {addCategory && <CategoryForm onSave={saveCategory} onCancel={() => setAddCategory(false)} />}
              {editCategory && <CategoryForm initial={editCategory} onSave={saveCategory} onCancel={() => setEditCategory(null)} />}

              <div className="space-y-3">
                {categories.map(c => (
                  <div key={c.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/15 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/20 flex items-center justify-center">
                      <Layers size={16} className="text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">{c.name}</p>
                      <p className="text-xs text-white/40">{c.slug}</p>
                    </div>
                    <p className="text-xs text-white/30">{products.filter(p => p.category_id === c.id).length} منتج</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditCategory(c); setAddCategory(false); }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-blue-900/40 hover:text-blue-300 text-white/50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: 'category', id: c.id })}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-900/40 hover:text-red-300 text-white/50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── IMAGES ── */}
          {section === 'images' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-black">إدارة الصور</h2>
              <BackgroundManager onToast={showToast} />
              <ImageProcessor onDone={(url) => showToast('تم معالجة الصورة — يمكنك استخدامها في المنتجات', 'ok')} />
            </div>
          )}

        </div>
      </main>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-black text-white text-lg">تأكيد الحذف</h3>
            <p className="text-white/60 text-sm">هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button onClick={() => confirmDelete.type === 'product' ? deleteProduct(confirmDelete.id) : deleteCategory(confirmDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Trash2 size={14} /> حذف
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-2.5 rounded-xl font-bold text-sm border border-white/10 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
