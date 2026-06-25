-- ==============================================================================
-- Cheese 1 Oven - Supabase Setup Script
-- ==============================================================================
-- قم بنسخ هذا السكربت بالكامل ولصقه في قسم SQL Editor في Supabase
-- واضغط على Run لتشغيله. سيقوم هذا السكربت بإنشاء الجداول اللازمة للمطبخ والسائق والطلبات.

-- 1. إنشاء جدول الأدوار والصلاحيات (لكلمات سر الدخول السريعة)
CREATE TABLE IF NOT EXISTS store_roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE, -- 'admin', 'kitchen', 'driver'
    pin_code TEXT NOT NULL,         -- كلمة السر / الرمز السري
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- إدراج كلمات السر الافتراضية التي طلبتها (يمكنك تعديلها من واجهة Supabase لاحقاً)
INSERT INTO store_roles (role_name, pin_code) VALUES 
('admin', '12345'),
('kitchen', '54321'),
('driver', '67890')
ON CONFLICT (role_name) DO UPDATE SET pin_code = EXCLUDED.pin_code;


-- 2. إنشاء جدول الطلبات (الذي سيبنى عليه عمل المطبخ والسائق لاحقاً)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    order_type TEXT NOT NULL DEFAULT 'pickup', -- 'pickup', 'delivery'
    notes TEXT,
    items JSONB NOT NULL, -- سيحتوي على مصفوفة الأصناف (البيتزا، الصوصات، السلطات، إلخ)
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- إضافة سياسات الأمان (RLS) للسماح بقراءة وتعديل الطلبات والأدوار (مؤقتاً مفتوحة لتسهيل التطوير)
ALTER TABLE store_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on store_roles" ON store_roles FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);

-- تفعيل ميزة التحديث المباشر (Realtime) لجدول الطلبات لكي يعمل المطبخ بشكل فوري
begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;
  -- re-create the supabase_realtime publication with no tables
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table orders;

-- ملاحظة هامة حول "User Space":
-- إذا قمت بإنشاء المستخدمين عبر قسم Authentication في Supabase (بالإيميل والباسورد)،
-- فنظام الدخول في الكود سيعتمد مؤقتاً على كلمات السر المحفوظة في هذا الجدول (store_roles) لتسريع الدخول بدون إيميل.
-- يمكنك إدارة كلمات السر من خلال هذا الجدول (store_roles) مباشرة من واجهة Table Editor.
