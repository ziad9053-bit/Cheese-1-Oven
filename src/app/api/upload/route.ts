import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    // ✅ createClient() يُستدعى داخل الدالة مباشرةً لضمان تحميل الجلسة في كل طلب
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ الرفع مباشرة بعد createClient()
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, {
        contentType: file.type || 'image/webp',
        upsert: true,
      });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Upload failed' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
