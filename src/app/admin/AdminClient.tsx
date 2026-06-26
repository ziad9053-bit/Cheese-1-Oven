"use client";

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Pencil, Trash2, Upload, Check, X, Loader2,
  ImagePlus, FileImage, LayoutDashboard, Package,
  Layers, Image, Palette, ArrowLeft, ArrowRight, ChevronLeft, Lock, Settings
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; description: string; price: number;
  image_url: string; category_id: number; product_type: string; is_available: boolean;
}
interface Category { id: number; name: string; slug: string; }
interface Sauce { id: number; name: string; description?: string; image_url: string; price: number; is_available: boolean; category_id?: number; product_type?: string; }
type Section = 'menu' | 'dashboard' | 'products' | 'categories' | 'sauces' | 'sauce-effects' | 'brand-identity' | 'images' | 'settings';

// ── Server upload (bypasses RLS) ──────────────────────────────────────────────
async function serverUpload(blob: Blob, path: string): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', new File([blob], path.split('/').pop()!, { type: blob.type || 'image/webp' }));
  fd.append('path', path);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const json = await res.json();
  return json.url ?? null;
}

// ── WebP converter (client-side) ───────────────────────────────────────────────
async function toWebP(file: File, maxW: number, maxH: number, q: number, checkTrans = false): Promise<{ blob: Blob; url: string; origSize: number; newSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        width  = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        if (checkTrans) {
          const tl = ctx.getImageData(0, 0, 1, 1).data[3];
          const tr = ctx.getImageData(width - 1, 0, 1, 1).data[3];
          const bl = ctx.getImageData(0, height - 1, 1, 1).data[3];
          const br = ctx.getImageData(width - 1, height - 1, 1, 1).data[3];
          // If all 4 corners are fully opaque (alpha >= 250), it's highly likely a solid background.
          if (tl > 250 && tr > 250 && bl > 250 && br > 250) {
            return reject(new Error('SOLID_BG'));
          }
        }

        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Failed'));
          resolve({ blob, url: URL.createObjectURL(blob), origSize: file.size, newSize: blob.size });
        }, 'image/webp', q / 100);
      };
    };
    reader.readAsDataURL(file);
  });
}

const fmt = (n: number) => n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'ok'|'err'; onClose: ()=>void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold
      ${type === 'ok' ? 'bg-green-950 border-green-500/50 text-green-300' : 'bg-red-950 border-red-500/50 text-red-300'}`}>
      {type === 'ok' ? <Check size={15}/> : <X size={15}/>} {msg}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={13}/></button>
    </div>
  );
}

// ── Image Processor ────────────────────────────────────────────────────────────
function ImageProcessor({ onUse, checkTrans = false }: { onUse?: (blob: Blob, previewUrl: string) => void; checkTrans?: boolean }) {
  const [maxW, setMaxW]     = useState(800);
  const [maxH, setMaxH]     = useState(800);
  const [quality, setQuality] = useState(88);
  const [orig, setOrig]     = useState<{ url: string; size: number } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setOrig({ url: URL.createObjectURL(f), size: f.size });
    setResult(null);
    setLoading(true);
    try {
      const r = await toWebP(f, maxW, maxH, quality, checkTrans);
      setResult({ blob: r.blob, url: r.url, size: r.newSize });
    } catch (e: any) {
      if (e.message === 'SOLID_BG') {
        alert('❌ عذراً! يجب أن تكون الصورة مفرغة (بدون خلفية) لكي لا تُغطي على الشاشة في الواجهة ثلاثية الأبعاد. يرجى تفريغها وإعادة رفعها.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white flex items-center gap-2">
        <FileImage size={17} className="text-pink-400"/> معالج الصور — WebP + تصغير
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {[['أقصى عرض (px)', maxW, setMaxW], ['أقصى ارتفاع (px)', maxH, setMaxH], ['جودة (1-100)', quality, setQuality]].map(([label, val, setter]) => (
          <label key={label as string} className="space-y-1">
            <span className="text-[11px] text-white/40">{label as string}</span>
            <input type="number" value={val as number} min={1} max={label === 'جودة (1-100)' ? 100 : undefined}
              onChange={e => (setter as (v: number) => void)(+e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-pink-500"/>
          </label>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-white/10 hover:border-pink-500/40 rounded-xl py-8 text-center cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <ImagePlus size={26} className="mx-auto text-white/25 mb-2"/>
        <p className="text-white/40 text-sm">اسحب صورة هنا أو <span className="text-pink-400 underline">انقر للاختيار</span></p>
        <p className="text-white/25 text-xs mt-1">PNG · JPG · WebP</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}/>
      </div>

      {loading && <div className="flex items-center gap-2 text-pink-400 text-sm"><Loader2 size={15} className="animate-spin"/> جاري المعالجة...</div>}

      {orig && result && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-white/40">الأصل — {fmt(orig.size)}</p>
              <img src={orig.url} alt="original" className="w-full h-36 object-contain rounded-xl bg-black/30 border border-white/5"/>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-green-400">WebP — {fmt(result.size)} ({Math.round((1 - result.size/orig.size)*100)}% ↓)</p>
              <img src={result.url} alt="webp" className="w-full h-36 object-contain rounded-xl bg-black/30 border border-green-500/20"/>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={result.url} download={`${fileName.replace(/\.[^.]+$/, '')}.webp`}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-bold border border-white/10 transition-colors">
              <Upload size={14}/> تحميل WebP
            </a>
            {onUse && (
              <button onClick={() => onUse(result.blob, result.url)}
                className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Check size={14}/> استخدم هذه الصورة
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Product Form ───────────────────────────────────────────────────────────────
function ProductForm({ initial, categories, onSave, onCancel, onToast }: {
  initial?: Product; categories: Category[];
  onSave: (p: Partial<Product>, blob?: Blob) => Promise<void>;
  onCancel: () => void;
  onToast: (msg: string, type: 'ok'|'err') => void;
}) {
  const [form, setForm]           = useState<Partial<Product>>(initial ?? { name: '', description: '', price: 0, image_url: '', category_id: categories[0]?.id ?? 1, product_type: 'pizza', is_available: true });
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [preview, setPreview]     = useState(initial?.image_url ?? '');
  const [showProc, setShowProc]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploadMode, setUploadMode] = useState<'url'|'file'>('url');

  const set = (k: keyof Product, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleProcessorDone = (blob: Blob, url: string) => {
    setImageBlob(blob);
    setPreview(url);
    setShowProc(false);
  };

  const handleDirectFileUpload = async (f: File) => {
    try {
      const r = await toWebP(f, 800, 800, 88, true); // force transparency check for products!
      setImageBlob(r.blob);
      setPreview(r.url);
    } catch (e: any) {
      if (e.message === 'SOLID_BG') {
        onToast('❌ توقف! يجب رفع صورة "مُفرّغة" (بدون خلفية بيضاء) لكي لا تُغطي على الديكور والألوان!', 'err');
      } else {
        onToast('حدث خطأ أثناء معالجة الصورة', 'err');
      }
    }
  };

  return (
    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white text-base">{initial ? '✏️ تعديل المنتج' : '➕ منتج جديد'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: 'اسم المنتج', key: 'name' as keyof Product, ph: 'مثال: بيتزا مرغريتا' },
          { label: 'السعر (ر.س)', key: 'price' as keyof Product, type: 'number' },
        ].map(f => (
          <label key={f.key} className="space-y-1">
            <span className="text-xs text-white/40">{f.label}</span>
            <input 
              type={f.type === 'number' ? 'text' : (f.type ?? 'text')}
              inputMode={f.type === 'number' ? 'decimal' : undefined}
              value={form[f.key]?.toString() ?? ''}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.ph ?? ''}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
          </label>
        ))}

        <label className="space-y-1">
          <span className="text-xs text-white/40">الصنف</span>
          <select value={form.category_id ?? ''} onChange={e => set('category_id', +e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-white/40">نوع المنتج</span>
          <select value={form.product_type ?? 'pizza'} onChange={e => set('product_type', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm">
            <option value="pizza">🍕 بيتزا</option>
            <option value="pastry">🥐 معجنات</option>
            <option value="drink">🥤 مشروبات</option>
            <option value="side">🫙 إضافات</option>
            <option value="salad">🥗 سلطات</option>
            <option value="sauce">🥣 صوصات</option>
          </select>
        </label>

        <label className="sm:col-span-2 space-y-1">
          <span className="text-xs text-white/40">الوصف</span>
          <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
            rows={2} placeholder="وصف مختصر..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm resize-none"/>
        </label>
      </div>

      {/* ── Image ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">الصورة</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUploadMode('url')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${uploadMode === 'url' ? 'border-pink-500 text-pink-300 bg-pink-950/50' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
              رابط URL
            </button>
            <button type="button" onClick={() => setUploadMode('file')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${uploadMode === 'file' ? 'border-pink-500 text-pink-300 bg-pink-950/50' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
              رفع صورة
            </button>
          </div>
        </div>

        {uploadMode === 'url' ? (
          <input value={form.image_url ?? ''} onChange={e => { set('image_url', e.target.value); setPreview(e.target.value); setImageBlob(null); }}
            placeholder="https://... (الصق رابط الصورة)"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        ) : (
          <div className="space-y-2">
            <DirectFileInput onFile={handleDirectFileUpload}/>
            <button type="button" onClick={() => setShowProc(!showProc)}
              className="w-full flex items-center justify-center gap-2 text-xs text-pink-400 hover:text-pink-300 border border-pink-500/20 rounded-xl py-2 transition-colors">
              <ImagePlus size={13}/> {showProc ? 'إخفاء معالج الصور المتقدم' : 'فتح معالج الصور (تحكم متقدم)'}
            </button>
            {showProc && <ImageProcessor onUse={handleProcessorDone} checkTrans={true} />}
          </div>
        )}

        {preview && (
          <div className="relative h-36 bg-black/30 rounded-xl border border-white/8 overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-full object-contain"/>
            {imageBlob && <div className="absolute top-2 left-2 bg-green-900/80 border border-green-500/40 text-green-300 text-[10px] px-2 py-0.5 rounded-full">جاهزة للرفع</div>}
            <button type="button" onClick={() => { setPreview(''); setImageBlob(null); set('image_url', ''); }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/70 border border-white/10 rounded-full p-1 transition-colors">
              <X size={13}/>
            </button>
          </div>
        )}
      </div>

      {/* Availability toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set('is_available', !form.is_available)}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.is_available ? 'bg-pink-600' : 'bg-white/10'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`}/>
        </button>
        <span className="text-sm text-white/60">{form.is_available ? '✅ متاح للطلب' : '❌ غير متاح'}</span>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={async () => { setSaving(true); await onSave({ ...form, price: Number(form.price) || 0 }, imageBlob ?? undefined); setSaving(false); }} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
          {saving ? <><Loader2 size={14} className="animate-spin"/> حفظ...</> : <><Check size={14}/> حفظ المنتج</>}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl font-bold text-sm border border-white/10 transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ── Direct File Input ──────────────────────────────────────────────────────────
function DirectFileInput({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border-2 border-dashed border-white/10 hover:border-pink-500/40 rounded-xl py-5 text-center cursor-pointer transition-colors"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
      <Upload size={20} className="mx-auto text-white/25 mb-1"/>
      <p className="text-white/40 text-xs">اسحب أو <span className="text-pink-400 underline">انقر للاختيار</span> — يتم تحويلها WebP تلقائياً</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}/>
    </div>
  );
}

// ── Category Form ─────────────────────────────────────────────────────────────
function CategoryForm({ initial, onSave, onCancel }: { initial?: Category; onSave: (c: Partial<Category>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Category>>(initial ?? { name: '', slug: '' });
  const [saving, setSaving] = useState(false);
  return (
    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white text-base">{initial ? '✏️ تعديل الصنف' : '➕ صنف جديد'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-white/40">اسم الصنف</span>
          <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="مثال: بيتزا"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-white/40">الرمز (slug)</span>
          <input value={form.slug ?? ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="pizza"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} حفظ
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl font-bold text-sm border border-white/10 transition-colors">إلغاء</button>
      </div>
    </div>
  );
}

// ── Sauce Form ─────────────────────────────────────────────────────────────
function SauceForm({ initial, onSave, onCancel, onToast }: { initial?: Sauce; onSave: (s: Partial<Sauce>, blob?: Blob) => Promise<void>; onCancel: () => void; onToast: (m: string, t: 'ok'|'err') => void; }) {
  const [form, setForm]           = useState<Partial<Sauce>>(initial ?? { name: '', image_url: '', price: 0, is_available: true });
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [preview, setPreview]     = useState(initial?.image_url ?? '');
  const [showProc, setShowProc]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploadMode, setUploadMode] = useState<'url'|'file'>('url');

  const set = (k: keyof Sauce, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleProcessorDone = (blob: Blob, url: string) => { setImageBlob(blob); setPreview(url); setShowProc(false); };
  const handleDirectFileUpload = async (f: File) => {
    try {
      const r = await toWebP(f, 400, 400, 88, true); // transparency check
      setImageBlob(r.blob); setPreview(r.url);
    } catch (e: any) {
      if (e.message === 'SOLID_BG') onToast('❌ توقف! يجب رفع صورة "مُفرّغة" (بدون خلفية) لكي تظهر بشكل جميل فوق الواجهة!', 'err');
      else onToast('حدث خطأ أثناء معالجة الصورة', 'err');
    }
  };

  return (
    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white text-base">{initial ? '✏️ تعديل الصوص' : '➕ صوص جديد'}</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-xs text-white/40">اسم الصوص</span>
          <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
            placeholder="مثال: رانش"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        </label>
        <label className="space-y-1 block">
          <span className="text-xs text-white/40">السعر (ر.س)</span>
          <input type="text" inputMode="decimal" value={form.price?.toString() ?? ''} onChange={e => set('price', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        </label>
      </div>

      {/* ── Image ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">صورة الصوص (WEBP شفافة)</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUploadMode('url')} className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${uploadMode === 'url' ? 'border-pink-500 text-pink-300 bg-pink-950/50' : 'border-white/10 text-white/40'}`}>رابط URL</button>
            <button type="button" onClick={() => setUploadMode('file')} className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${uploadMode === 'file' ? 'border-pink-500 text-pink-300 bg-pink-950/50' : 'border-white/10 text-white/40'}`}>رفع صورة</button>
          </div>
        </div>

        {uploadMode === 'url' ? (
          <input value={form.image_url ?? ''} onChange={e => { set('image_url', e.target.value); setPreview(e.target.value); setImageBlob(null); }}
            placeholder="https://... (الصق رابط الصورة)"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"/>
        ) : (
          <div className="space-y-2">
            <DirectFileInput onFile={handleDirectFileUpload}/>
            <button type="button" onClick={() => setShowProc(!showProc)}
              className="w-full flex items-center justify-center gap-2 text-xs text-pink-400 hover:text-pink-300 border border-pink-500/20 rounded-xl py-2 transition-colors">
              <ImagePlus size={13}/> {showProc ? 'إخفاء المعالج' : 'استخدام معالج الصور'}
            </button>
            {showProc && <ImageProcessor onUse={handleProcessorDone} checkTrans={true} />}
          </div>
        )}

        {preview && (
          <div className="relative h-24 bg-black/30 rounded-xl border border-white/8 overflow-hidden flex justify-center p-2">
            <img src={preview} alt="preview" className="h-full object-contain drop-shadow-xl"/>
            {imageBlob && <div className="absolute top-2 left-2 bg-green-900/80 border border-green-500/40 text-green-300 text-[10px] px-2 py-0.5 rounded-full">جاهزة للرفع</div>}
            <button type="button" onClick={() => { setPreview(''); setImageBlob(null); set('image_url', ''); }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/70 border border-white/10 rounded-full p-1 transition-colors">
              <X size={13}/>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set('is_available', !form.is_available)}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.is_available ? 'bg-pink-600' : 'bg-white/10'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`}/>
        </button>
        <span className="text-sm text-white/60">{form.is_available ? '✅ يظهر للزبون' : '❌ مخفي'}</span>
      </div>

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={async () => { setSaving(true); await onSave({ ...form, price: Number(form.price) || 0 }, imageBlob ?? undefined); setSaving(false); }} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} حفظ
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl font-bold text-sm border border-white/10 transition-colors">إلغاء</button>
      </div>
    </div>
  );
}

// ── Background Manager ─────────────────────────────────────────────────────────
function BackgroundManager({ onToast }: { onToast: (m: string, t: 'ok'|'err') => void }) {
  const [bgBlob, setBgBlob]       = useState<Blob | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const [bgType, setBgType]       = useState<'pizza'|'pastry'>('pizza');
  const [uploading, setUploading] = useState(false);
  const [showProc, setShowProc]   = useState(false);

  const handleProcessorDone = (blob: Blob, url: string) => { setBgBlob(blob); setBgPreview(url); setShowProc(false); };

  const handleUpload = async () => {
    if (!bgBlob) return onToast('اختر صورة أولاً', 'err');
    setUploading(true);
    const url = await serverUpload(bgBlob, `images/bg-${bgType}.jpg`);
    setUploading(false);
    if (url) onToast(`✅ تم رفع خلفية ${bgType === 'pizza' ? 'البيتزا' : 'المعجنات'}`, 'ok');
    else onToast('فشل الرفع — تحقق من صلاحيات Supabase Storage', 'err');
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-black text-white flex items-center gap-2"><Palette size={17} className="text-pink-400"/> إدارة الخلفيات</h3>

      <div className="flex gap-2">
        {(['pizza', 'pastry'] as const).map(t => (
          <button key={t} onClick={() => setBgType(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${bgType === t ? 'border-pink-500 bg-pink-600/20 text-pink-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
            {t === 'pizza' ? '🍕 بيتزا' : '🥐 معجنات'}
          </button>
        ))}
      </div>

      <DirectFileInput onFile={async f => { const r = await toWebP(f, 1920, 1080, 90); setBgBlob(r.blob); setBgPreview(r.url); }}/>

      <button onClick={() => setShowProc(!showProc)}
        className="w-full flex items-center justify-center gap-2 text-xs text-pink-400 hover:text-pink-300 border border-pink-500/20 rounded-xl py-2 transition-colors">
        <ImagePlus size={13}/> {showProc ? 'إخفاء التحكم المتقدم' : 'تحكم متقدم في الأبعاد (1920×1080 مُوصى)'}
      </button>

      {showProc && <ImageProcessor onUse={handleProcessorDone}/>}

      {bgPreview && (
        <div className="relative h-40 rounded-xl overflow-hidden border border-white/10">
          <img src={bgPreview} className="w-full h-full object-cover" alt="bg"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
            <span className="text-xs text-white/70 bg-black/60 px-2 py-0.5 rounded-full">معاينة الخلفية</span>
          </div>
          <button onClick={() => { setBgPreview(''); setBgBlob(null); }}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-900/70 border border-white/10 rounded-full p-1 transition-colors">
            <X size={13}/>
          </button>
        </div>
      )}

      <button onClick={handleUpload} disabled={!bgBlob || uploading}
        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
        {uploading ? <><Loader2 size={14} className="animate-spin"/> جاري الرفع...</> : <><Upload size={14}/> رفع الخلفية</>}
      </button>
    </div>
  );
}

// ── Main Admin Client ─────────────────────────────────────────────────────────
export default function AdminClient({ initialProducts, initialCategories }: {
  initialProducts: Product[]; initialCategories: Category[];
}) {
  const [section, setSection]           = useState<Section>('menu');
  const [products, setProducts]         = useState<Product[]>(initialProducts.filter(p => p.product_type !== 'sauce'));
  const [categories, setCategories]     = useState<Category[]>(initialCategories);
  const [toast, setToast]               = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [editProduct, setEditProduct]   = useState<Product | null>(null);
  const [addProduct, setAddProduct]     = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [addCategory, setAddCategory]   = useState(false);
  const [sauces, setSauces]             = useState<Sauce[]>(initialProducts.filter(p => p.product_type === 'sauce'));
  const [editSauce, setEditSauce]       = useState<Sauce | null>(null);
  const [addSauce, setAddSauce]         = useState(false);
  const [confirmDel, setConfirmDel]     = useState<{ type: 'product'|'category'|'sauce'; id: any } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Settings State
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch initial settings
  React.useEffect(() => {
    supabase.from('store_roles').select('pin_code').eq('role_name', 'google_maps_url').single().then(({ data }) => {
      if (data) setGoogleMapsUrl(data.pin_code);
    });
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    // Upsert the google maps url into store_roles
    const { error } = await supabase.from('store_roles').upsert({
      role_name: 'google_maps_url',
      pin_code: googleMapsUrl || ''
    }, { onConflict: 'role_name' });
    
    if (error) {
      showToast('فشل حفظ الإعدادات - يرجى التأكد من صلاحيات قاعدة البيانات', 'err');
    } else {
      showToast('✅ تم حفظ الإعدادات بنجاح', 'ok');
    }
    setSavingSettings(false);
  };

  const showToast = (msg: string, type: 'ok'|'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const saveProduct = async (data: Partial<Product>, blob?: Blob) => {
    let imageUrl = data.image_url;
    if (blob) {
      const url = await serverUpload(blob, `images/products/${Date.now()}.webp`);
      if (url) imageUrl = url;
      else return showToast('فشل رفع الصورة — تأكد من صلاحيات Supabase Storage', 'err');
    }
    const payload = { ...data, image_url: imageUrl };
    if (data.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', data.id);
      if (error) return showToast('فشل التعديل: ' + error.message, 'err');
      setProducts(ps => ps.map(p => p.id === data.id ? { ...p, ...payload } as Product : p));
      showToast('✅ تم تعديل المنتج', 'ok');
    } else {
      const { data: ins, error } = await supabase.from('products').insert([payload]).select().single();
      if (error || !ins) return showToast('فشل الإضافة: ' + error?.message, 'err');
      setProducts(ps => [...ps, ins as Product]);
      showToast('✅ تمت الإضافة', 'ok');
    }
    setEditProduct(null); setAddProduct(false);
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return showToast('فشل الحذف', 'err');
    setProducts(ps => ps.filter(p => p.id !== id));
    showToast('تم الحذف', 'ok'); setConfirmDel(null);
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const saveCategory = async (data: Partial<Category>) => {
    if (data.id) {
      const { error } = await supabase.from('categories').update(data).eq('id', data.id);
      if (error) return showToast('فشل التعديل', 'err');
      setCategories(cs => cs.map(c => c.id === data.id ? { ...c, ...data } as Category : c));
      showToast('✅ تم التعديل', 'ok');
    } else {
      const { data: ins, error } = await supabase.from('categories').insert([data]).select().single();
      if (error || !ins) return showToast('فشل الإضافة', 'err');
      setCategories(cs => [...cs, ins as Category]);
      showToast('✅ تمت الإضافة', 'ok');
    }
    setEditCategory(null); setAddCategory(false);
  };

  const deleteCategory = async (id: number) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return showToast('فشل الحذف', 'err');
    setCategories(cs => cs.filter(c => c.id !== id));
    showToast('تم الحذف', 'ok'); setConfirmDel(null);
  };

  // ── Sauce CRUD ────────────────────────────────────────────────────────────
  const saveSauce = async (data: Partial<Sauce>, blob?: Blob) => {
    let imageUrl = data.image_url;
    if (blob) {
      const url = await serverUpload(blob, `images/sauces/${Date.now()}.webp`);
      if (url) imageUrl = url;
      else return showToast('فشل رفع الصورة — تأكد من صلاحيات Supabase Storage', 'err');
    }
    const payload = { 
      ...data, 
      image_url: imageUrl, 
      product_type: 'sauce',
      category_id: categories[0]?.id ?? 1,
      description: data.description ?? '' 
    };
    
    if (data.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', data.id);
      if (error) return showToast('فشل التعديل: ' + error.message, 'err');
      // Update both sauces and products state to keep them in sync
      setProducts(ps => ps.map(p => p.id === data.id ? { ...p, ...payload } as Product : p));
      setSauces(ss => ss.map(s => s.id === data.id ? { ...s, ...payload } as Sauce : s));
      showToast('✅ تم تعديل الصوص', 'ok');
    } else {
      const { data: ins, error } = await supabase.from('products').insert([payload]).select().single();
      if (error || !ins) return showToast('فشل الإضافة: ' + error?.message, 'err');
      setProducts(ps => [...ps, ins as Product]);
      setSauces(ss => [...ss, ins as Sauce]);
      showToast('✅ تمت الإضافة', 'ok');
    }
    setEditSauce(null); setAddSauce(false);
  };

  const deleteSauce = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return showToast('فشل الحذف', 'err');
    setSauces(ss => ss.filter(s => s.id !== id));
    showToast('تم الحذف', 'ok'); setConfirmDel(null);
  };

  const stats = [
    { label: 'إجمالي المنتجات', value: products.length, color: 'text-pink-400' },
    { label: 'متاح للطلب', value: products.filter(p => p.is_available).length, color: 'text-green-400' },
    { label: 'الأصناف', value: categories.length, color: 'text-blue-400' },
    { label: 'الصوصات', value: sauces.length, color: 'text-yellow-400' },
    { label: 'غير متاح', value: products.filter(p => !p.is_available).length, color: 'text-red-400' },
  ];

  const navItems = [
    { id: 'dashboard' as Section, label: 'لوحة التحكم', icon: <LayoutDashboard size={17}/> },
    { id: 'products'  as Section, label: 'المنتجات',    icon: <Package size={17}/> },
    { id: 'categories'as Section, label: 'الأصناف',     icon: <Layers size={17}/> },
    { id: 'sauces'    as Section, label: 'الصوصات',      icon: <img src="https://emojigraph.org/media/apple/drop-of-blood_1fa78.png" className="w-4 h-4 opacity-70 filter hue-rotate-90"/> },
    { id: 'sauce-effects' as Section, label: 'تأثيرات الصوص', icon: <Image size={17}/> },
    { id: 'brand-identity' as Section, label: 'الهوية التجارية', icon: <Image size={17}/> }, /* Needs a better icon, maybe use Star or Crown, wait I'll just use a layout icon */
    { id: 'images'    as Section, label: 'إدارة الصور', icon: <Image size={17}/> },
    { id: 'settings'  as Section, label: 'إعدادات المتجر', icon: <Settings size={17}/> },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-950 text-white pb-20 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-5 duration-300 ${toast.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start w-full">
              <button 
                onClick={() => window.location.href = '/'}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors self-start"
                title="العودة للصفحة الرئيسية"
              >
                <ArrowRight size={24} className="text-white/70" />
              </button>
              <div className="text-center space-y-2 flex-1 -ml-10">
                <div className="w-16 h-16 bg-pink-600/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/30">
                  <Lock size={30} />
                </div>
                <h2 className="text-2xl font-black text-white">بوابة الدخول</h2>
                <p className="text-white/40 text-sm">اختر القسم وأدخل كلمة المرور</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Admin Login Row */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-pink-500/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                    <LayoutDashboard size={18} className="text-pink-500" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">الإدارة</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    id="admin-pass"
                    placeholder="كلمة المرور..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const pass = (e.target as HTMLInputElement).value;
                        if (pass === '12345') setIsAuthenticated(true);
                        else showToast('كلمة السر للإدارة خاطئة!', 'err');
                      }
                    }}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-center text-white focus:outline-none focus:border-pink-500 font-black tracking-widest text-sm"
                  />
                  <button 
                    onClick={() => {
                      const pass = (document.getElementById('admin-pass') as HTMLInputElement).value;
                      if (pass === '12345') setIsAuthenticated(true);
                      else showToast('كلمة السر للإدارة خاطئة!', 'err');
                    }}
                    className="bg-pink-600 text-white font-bold px-4 rounded-xl hover:bg-pink-500 transition-colors"
                  >
                    دخول
                  </button>
                </div>
              </div>

              {/* Kitchen Login Row */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-orange-500/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Layers size={18} className="text-orange-500" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">المطبخ</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    id="kitchen-pass"
                    placeholder="كلمة المرور..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const pass = (e.target as HTMLInputElement).value;
                        if (pass === '54321') window.location.href = '/kitchen';
                        else showToast('كلمة السر للمطبخ خاطئة!', 'err');
                      }
                    }}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-center text-white focus:outline-none focus:border-orange-500 font-black tracking-widest text-sm"
                  />
                  <button 
                    onClick={() => {
                      const pass = (document.getElementById('kitchen-pass') as HTMLInputElement).value;
                      if (pass === '54321') window.location.href = '/kitchen';
                      else showToast('كلمة السر للمطبخ خاطئة!', 'err');
                    }}
                    className="bg-orange-600 text-white font-bold px-4 rounded-xl hover:bg-orange-500 transition-colors"
                  >
                    دخول
                  </button>
                </div>
              </div>

              {/* Driver Login Row */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-blue-500/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Package size={18} className="text-blue-500" />
                  </div>
                  <span className="font-bold text-white text-lg flex-1">سائق التوصيل</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    id="driver-pass"
                    placeholder="كلمة المرور..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const pass = (e.target as HTMLInputElement).value;
                        if (pass === '67890') window.location.href = '/driver';
                        else showToast('كلمة السر للسائق خاطئة!', 'err');
                      }
                    }}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-center text-white focus:outline-none focus:border-blue-500 font-black tracking-widest text-sm"
                  />
                  <button 
                    onClick={() => {
                      const pass = (document.getElementById('driver-pass') as HTMLInputElement).value;
                      if (pass === '67890') window.location.href = '/driver';
                      else showToast('كلمة السر للسائق خاطئة!', 'err');
                    }}
                    className="bg-blue-600 text-white font-bold px-4 rounded-xl hover:bg-blue-500 transition-colors"
                  >
                    دخول
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-6">

        {/* MENU */}
        {section === 'menu' && (
          <div className="space-y-4 pt-4 md:pt-8 relative">
            <button 
              onClick={() => window.location.href = '/'}
              className="absolute top-0 right-0 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              title="العودة للصفحة الرئيسية"
            >
              <ArrowRight size={24} className="text-white/70" />
            </button>
            <div className="text-center mb-10 space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-widest font-black">لوحة تحكم</p>
              <h1 className="text-3xl font-black text-white">Cheese 1 Oven 🍕</h1>
            </div>

            <div className="space-y-3">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setSection(item.id)}
                  className="w-full flex items-center justify-between p-5 bg-zinc-900 border border-white/8 rounded-2xl hover:bg-zinc-800 hover:border-white/20 transition-all group shadow-lg">
                  <div className="flex items-center gap-4 text-lg font-black text-white/90 group-hover:text-white">
                    <span className="text-pink-400 p-3 bg-pink-500/10 rounded-xl group-hover:scale-110 group-hover:bg-pink-500/20 transition-all">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <ChevronLeft size={20} className="text-white/30 group-hover:text-pink-400 group-hover:-translate-x-1 transition-all"/>
                </button>
              ))}
            </div>

            <a href="/" className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors mt-8 font-bold text-sm text-white/50 hover:text-white">
              <ArrowRight size={18}/> العودة للتطبيق
            </a>
          </div>
        )}

        {/* CONTENT WRAPPER */}
        {section !== 'menu' && (
          <div className="space-y-6 pt-4">
            <button onClick={() => setSection('menu')}
              className="flex items-center gap-2 text-pink-400 font-bold bg-pink-500/10 hover:bg-pink-500/20 px-4 py-2.5 rounded-xl transition-colors text-sm w-fit">
              <ArrowRight size={18}/> رجوع للقائمة
            </button>

            {/* DASHBOARD */}
            {section === 'dashboard' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-2xl font-black">لوحة التحكم الرئيسية</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(s => (
                  <div key={s.label} className="bg-zinc-900 border border-white/8 rounded-2xl p-4">
                    <p className="text-[11px] text-white/40 mb-1">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-zinc-900 border border-white/8 rounded-2xl p-5">
                <h3 className="font-bold text-white/60 text-sm mb-3">المنتجات</h3>
                {products.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0"/>
                      : <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">🍕</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-white/30">{p.product_type}</p>
                    </div>
                    <p className="text-sm font-black text-pink-400 shrink-0">{p.price} ر.س</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${p.is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {p.is_available ? 'متاح' : 'مغلق'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          {section === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">المنتجات ({products.length})</h2>
                <button onClick={() => { setAddProduct(true); setEditProduct(null); }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Plus size={15}/> إضافة منتج
                </button>
              </div>

              {products.map(p => (
                <div key={p.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex items-center gap-3 hover:border-white/15 transition-colors">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"/>
                    : <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-2xl border border-white/8">🍕</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white truncate">{p.name}</p>
                    <p className="text-xs text-white/40">{p.price} ر.س · {p.product_type}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${p.is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {p.is_available ? '✅ متاح' : '❌ مغلق'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => { setEditProduct(p); setAddProduct(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 text-xs font-bold border border-blue-500/30 transition-colors w-full justify-center">
                      <Pencil size={13}/> تعديل
                    </button>
                    <button onClick={() => setConfirmDel({ type: 'product', id: p.id })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-900/30 hover:bg-red-800/50 text-red-300 text-xs font-bold border border-red-500/20 transition-colors w-full justify-center">
                      <Trash2 size={13}/> حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES */}
          {section === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">الأصناف ({categories.length})</h2>
                <button onClick={() => { setAddCategory(true); setEditCategory(null); }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Plus size={15}/> إضافة صنف
                </button>
              </div>

              {addCategory && <CategoryForm onSave={saveCategory} onCancel={() => setAddCategory(false)}/>}
              {editCategory && <CategoryForm initial={editCategory} onSave={saveCategory} onCancel={() => setEditCategory(null)}/>}

              {categories.map(c => (
                <div key={c.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex items-center gap-3 hover:border-white/15 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-500/20 flex items-center justify-center shrink-0">
                    <Layers size={16} className="text-pink-400"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white">{c.name}</p>
                    <p className="text-xs text-white/30">{c.slug} · {products.filter(p => p.category_id === c.id).length} منتج</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditCategory(c); setAddCategory(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-xs font-bold border border-blue-500/20 transition-colors">
                      <Pencil size={13}/> تعديل
                    </button>
                    <button onClick={() => setConfirmDel({ type: 'category', id: c.id })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold border border-red-500/10 transition-colors">
                      <Trash2 size={13}/> حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SAUCES */}
          {section === 'sauces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">الصوصات ({sauces.length})</h2>
                <button onClick={() => { setAddSauce(true); setEditSauce(null); }}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Plus size={15}/> إضافة صوص
                </button>
              </div>

              {sauces.map(s => (
                <div key={s.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex items-center gap-3 hover:border-white/15 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/10 p-1 relative">
                    <img src={s.image_url} alt={s.name} className="w-full h-full object-contain"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white">{s.name}</p>
                    <p className="text-xs text-white/40">{s.price} ر.س</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${s.is_available ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {s.is_available ? '✅ مفعل (يظهر)' : '❌ مخفي'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => { setEditSauce(s); setAddSauce(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 text-xs font-bold border border-blue-500/30 transition-colors w-full justify-center">
                      <Pencil size={13}/> تعديل
                    </button>
                    <button onClick={() => setConfirmDel({ type: 'sauce', id: s.id })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-900/30 hover:bg-red-800/50 text-red-300 text-xs font-bold border border-red-500/20 transition-colors w-full justify-center">
                      <Trash2 size={13}/> حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SAUCE EFFECTS */}
          {section === 'sauce-effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">تأثيرات الصوص ({sauces.length})</h2>
                <p className="text-xs text-white/40">ارفع صورة شفافة (PNG/WEBP) لكل صوص لتظهر فوق البيتزا عند اختياره</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sauces.map(s => {
                  const hasEffect = s.description?.startsWith('http');
                  return (
                    <div key={s.id} className="bg-zinc-900 border border-white/8 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/10 p-1">
                          <img src={s.image_url} alt={s.name} className="w-full h-full object-contain"/>
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-white">{s.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${hasEffect ? 'bg-green-900/50 text-green-400' : 'bg-white/10 text-white/40'}`}>
                            {hasEffect ? '✅ تأثير مضاف' : 'لم يتم إضافة تأثير'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {hasEffect ? (
                          <div className="relative w-20 h-20 bg-black/30 rounded-xl border border-white/10 flex items-center justify-center p-1 group">
                            <img src={s.description!} alt="Effect" className="w-full h-full object-contain"/>
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('products').update({ description: '' }).eq('id', s.id);
                                if (!error) {
                                  setSauces(ss => ss.map(ss => ss.id === s.id ? { ...ss, description: '' } : ss));
                                  showToast('تم إزالة التأثير', 'ok');
                                }
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                            >
                              <Trash2 size={16} className="text-red-400"/>
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-black/30 rounded-xl border border-dashed border-white/20 flex items-center justify-center flex-col gap-1 text-white/30">
                            <ImagePlus size={16}/>
                          </div>
                        )}
                        
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold border border-white/10 transition-colors cursor-pointer">
                            <Upload size={14}/> رفع تأثير جديد
                            <input 
                              type="file" 
                              accept="image/png,image/webp" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                showToast('جاري الرفع...', 'ok');
                                const url = await serverUpload(file, `images/sauce-effects/${s.id}-${Date.now()}.png`);
                                if (url) {
                                  const { error } = await supabase.from('products').update({ description: url }).eq('id', s.id);
                                  if (!error) {
                                    setSauces(ss => ss.map(ss => ss.id === s.id ? { ...ss, description: url } : ss));
                                    showToast('✅ تم تحديث التأثير بنجاح', 'ok');
                                  } else {
                                    showToast('حدث خطأ في قاعدة البيانات', 'err');
                                  }
                                } else {
                                  showToast('فشل الرفع', 'err');
                                }
                              }}
                            />
                          </label>
                          
                          {hasEffect && (
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('products').update({ description: '' }).eq('id', s.id);
                                if (!error) {
                                  setSauces(ss => ss.map(ss => ss.id === s.id ? { ...ss, description: '' } : ss));
                                  showToast('تم إزالة التأثير', 'ok');
                                }
                              }}
                              className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl text-xs font-bold border border-red-500/20 transition-colors"
                            >
                              <Trash2 size={14}/> حذف التأثير
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BRAND IDENTITY */}
          {section === 'brand-identity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">الهوية التجارية</h2>
                <p className="text-xs text-white/40">تخصيص الشعار خلف قائمة الصوصات</p>
              </div>
              
              {(() => {
                const settingsProd = products.find(p => p.product_type === 'brand_settings');
                const defaultSettings = { isVisible: true, text: 'Cheese 1 Oven', font: 'var(--font-pacifico)', innerColor: '#FF6347', outerColor: '#FFFDD0' };
                let currentSettings = defaultSettings;
                try { if (settingsProd?.description) currentSettings = { ...defaultSettings, ...JSON.parse(settingsProd.description) }; } catch(e){}

                const saveSettings = async (newSettings: any) => {
                  const desc = JSON.stringify(newSettings);
                  if (settingsProd) {
                    const { error } = await supabase.from('products').update({ description: desc }).eq('id', settingsProd.id);
                    if (!error) {
                      setProducts(ps => ps.map(p => p.id === settingsProd.id ? { ...p, description: desc } : p));
                      showToast('تم حفظ إعدادات الهوية', 'ok');
                    }
                  } else {
                    const payload = { name: 'Brand Settings', description: desc, price: 0, image_url: '', category_id: categories[0]?.id ?? 1, product_type: 'brand_settings', is_available: false };
                    const { data, error } = await supabase.from('products').insert([payload]).select().single();
                    if (!error && data) {
                      setProducts(ps => [...ps, data as Product]);
                      showToast('تم إنشاء وحفظ إعدادات الهوية', 'ok');
                    }
                  }
                };

                const update = (key: string, val: any) => {
                  saveSettings({ ...currentSettings, [key]: val });
                };

                return (
                  <div className="bg-zinc-900 border border-white/8 rounded-2xl p-5 space-y-6">
                    {/* Live Preview */}
                    <div className="h-40 bg-black/50 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 relative">
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff11 1px, transparent 1px)', backgroundSize: '10px 10px' }}/>
                      {currentSettings.isVisible ? (
                        <h1 
                          className="text-4xl md:text-5xl text-center whitespace-normal leading-none px-4 break-words drop-shadow-2xl"
                          style={{
                            fontFamily: currentSettings.font,
                            color: currentSettings.innerColor,
                            WebkitTextStroke: `2px ${currentSettings.outerColor}`,
                          }}
                        >
                          {currentSettings.text}
                        </h1>
                      ) : (
                        <p className="text-white/30 font-bold">الهوية مخفية 👁️‍🗨️</p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="text-sm font-bold text-white/80">عرض الهوية للعملاء</span>
                        <button onClick={() => update('isVisible', !currentSettings.isVisible)}
                          className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${currentSettings.isVisible ? 'bg-green-500' : 'bg-zinc-700'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${currentSettings.isVisible ? '-translate-x-6' : ''}`} />
                        </button>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs text-white/40">نص الهوية (اسم المحل)</span>
                        <input type="text" value={currentSettings.text} onChange={e => {
                          const val = e.target.value;
                          const merged = { ...currentSettings, text: val };
                          setProducts(ps => ps.map(p => p.id === settingsProd?.id ? { ...p, description: JSON.stringify(merged) } : p));
                        }}
                        onBlur={e => update('text', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm"/>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs text-white/40">نوع الخط المميّز</span>
                        <select value={currentSettings.font} onChange={e => update('font', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 text-sm" style={{ fontFamily: currentSettings.font }}>
                          <option value="var(--font-pacifico)" style={{ fontFamily: 'var(--font-pacifico)' }}>Pacifico (مرح وانسيابي)</option>
                          <option value="var(--font-lobster)" style={{ fontFamily: 'var(--font-lobster)' }}>Lobster (كلاسيكي)</option>
                          <option value="var(--font-righteous)" style={{ fontFamily: 'var(--font-righteous)' }}>Righteous (عصري بارز)</option>
                          <option value="var(--font-bebas)" style={{ fontFamily: 'var(--font-bebas)' }}>Bebas Neue (طويل وعريض)</option>
                          <option value="var(--font-chewy)" style={{ fontFamily: 'var(--font-chewy)' }}>Chewy (كرتوني سميك)</option>
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="text-xs text-white/40">اللون الداخلي</span>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
                            <input type="color" value={currentSettings.innerColor} onChange={e => update('innerColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"/>
                            <span className="text-xs text-white/60 uppercase">{currentSettings.innerColor}</span>
                          </div>
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs text-white/40">لون الإطار (الخارجي)</span>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
                            <input type="color" value={currentSettings.outerColor} onChange={e => update('outerColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"/>
                            <span className="text-xs text-white/60 uppercase">{currentSettings.outerColor}</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* IMAGES */}
          {section === 'images' && (
            <div className="space-y-5">
              <h2 className="text-xl font-black">إدارة الصور</h2>
              <BackgroundManager onToast={showToast}/>
              <ImageProcessor/>
            </div>
          )}
          
          {/* SETTINGS */}
          {section === 'settings' && (
            <div className="space-y-5">
              <h2 className="text-xl font-black">إعدادات المتجر</h2>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">رابط تقييم جوجل ماب (يظهر للعميل بعد استلام الطلب)</label>
                  <input 
                    type="url"
                    value={googleMapsUrl}
                    onChange={e => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-2">اترك الحقل فارغاً إذا كنت لا تريد إظهار زر التقييم للعملاء.</p>
                </div>
                
                <button 
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </div>
            </div>
          )}

      </div>
      )}

      {/* ── Product Add/Edit Modal ─────────────────────────────────────────── */}
      {(addProduct || editProduct) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <ProductForm
              initial={editProduct ?? undefined}
              categories={categories}
              onSave={saveProduct}
              onCancel={() => { setAddProduct(false); setEditProduct(null); }}
              onToast={showToast}
            />
          </div>
        </div>
      )}

      {/* ── Sauce Add/Edit Modal ─────────────────────────────────────────── */}
      {(addSauce || editSauce) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <SauceForm
              initial={editSauce ?? undefined}
              onSave={saveSauce}
              onCancel={() => { setAddSauce(false); setEditSauce(null); }}
              onToast={showToast}
            />
          </div>
        </div>
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-black text-white">تأكيد الحذف</h3>
            <p className="text-white/50 text-sm">هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <button onClick={() => confirmDel.type === 'product' ? deleteProduct(confirmDel.id) : confirmDel.type === 'category' ? deleteCategory(confirmDel.id) : deleteSauce(confirmDel.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                <Trash2 size={14}/> حذف
              </button>
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 py-2.5 rounded-xl font-bold text-sm border border-white/10 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      </div>
      )}
    </div>
  );
}
