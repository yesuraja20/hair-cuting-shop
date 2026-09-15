-- ==============================================================================
-- AUREUS & BLADE - SUPABASE DATABASE SCHEMA SETUP
-- Paste this script into your Supabase Dashboard -> SQL Editor and click RUN
-- ==============================================================================

-- 1. TABLE: Customer Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmation_code TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    barber_id TEXT NOT NULL,
    barber_name TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'atelier', -- 'online' or 'atelier'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'refunded'
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'confirmed', 'completed', 'cancelled'
);

-- Index for fast sorting by date
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- 2. TABLE: Services & Pricing
CREATE TABLE IF NOT EXISTS public.services_pricing (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT NOT NULL DEFAULT '45 MIN',
    price NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    features JSONB DEFAULT '[]'::jsonb,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE: Website Images
CREATE TABLE IF NOT EXISTS public.site_images (
    image_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- Allow public to submit appointments (INSERT)
CREATE POLICY "Allow public booking insert" 
ON public.bookings FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow public / admin to view bookings
CREATE POLICY "Allow read bookings" 
ON public.bookings FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow updates (e.g. status changes by admin)
CREATE POLICY "Allow update bookings" 
ON public.bookings FOR UPDATE 
TO anon, authenticated 
USING (true);

-- Allow delete bookings
CREATE POLICY "Allow delete bookings" 
ON public.bookings FOR DELETE 
TO anon, authenticated 
USING (true);

-- Services: Allow read to everyone, update/insert to anon/authenticated
CREATE POLICY "Allow public read services" 
ON public.services_pricing FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow admin manage services" 
ON public.services_pricing FOR ALL 
TO anon, authenticated 
USING (true);

-- Site Images: Allow read to everyone, update/insert to anon/authenticated
CREATE POLICY "Allow public read images" 
ON public.site_images FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow admin manage images" 
ON public.site_images FOR ALL 
TO anon, authenticated 
USING (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed Services & Pricing
INSERT INTO public.services_pricing (id, title, description, duration, price, display_order, features)
VALUES 
('service-royal', 'The Royal Executive Cut', 'Tailored scissor architecture, perimeter razor detailing, relaxing peppermint scalp massage, and bespoke styling with matte clay.', '50 MIN', 65.00, 1, '["Comprehensive Face Shape Consultation", "Dual Shampoo & Conditioning Wash", "Straight Razor Neck Line Detailing"]'),
('service-fade', 'Artisan Razor Fade & Texture', 'Seamless zero-skin transition, textured shear work on top, razor hairline crisping, and talc finish for a sharp modern profile.', '45 MIN', 55.00, 2, '["High, Mid, Low or Drop Fade Transition", "Foil Shaver & Razor Blend", "Texturizing Shears Finish"]'),
('service-beard', 'Beard Sculpt & Hot Towel Shave', 'Three essential oil hot towel wraps, warm badger foam lather, straight razor line definition, and sandalwood conditioning balm.', '40 MIN', 45.00, 3, '["Eucalyptus Steamed Towel Compress", "Feather Razor Precision Shaping", "Botanical Beard Oil Hydration"]'),
('service-ritual', 'The Complete Gentleman''s Ritual', 'The flagship experience: Executive haircut, full beard sculpt or traditional wet shave, charcoal face mask, and scotch tasting.', '80 MIN', 110.00, 4, '["Full Haircut & Beard Treatment", "Volcanic Charcoal Facial & Steam", "Complimentary Single Malt Selection"]'),
('service-scalp', 'Scalp Detox & Stimulating Therapy', 'Exfoliating tea tree scrub, pressurized oxygen infusion, acupressure temple massage, and follicle-revitalizing tonic treatment.', '35 MIN', 40.00, 5, '["Micro-Exfoliating Scalp Polish", "High-Frequency Wand Treatment", "Cooling Mint Hydro-Rinse"]'),
('service-duo', 'Father & Son Heritage Cut', 'Generational grooming experience side by side in executive chairs with custom refreshments and matching finishing touches.', '75 MIN', 95.00, 6, '["Two Simultaneous Precision Cuts", "Heritage Tonic Application", "Polaroid Atelier Souvenir Photograph"]')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    price = EXCLUDED.price;

-- Seed Default Website Images
INSERT INTO public.site_images (image_key, label, image_url, category)
VALUES
('hero_bg', 'Hero Background Interior', 'assets/images/hero.jpg', 'hero'),
('barber_marcus', 'Marcus Vance (Master Craftsman)', 'assets/images/master-barber.jpg', 'barbers'),
('barber_julian', 'Julian Drake (Fade Specialist)', 'assets/images/fade-cut.jpg', 'barbers'),
('barber_alexander', 'Alexander Roy (Straight Razor)', 'assets/images/beard-grooming.jpg', 'barbers'),
('gallery_1', 'Gallery: Skin Fade & Crop', 'assets/images/fade-cut.jpg', 'gallery'),
('gallery_2', 'Gallery: Hot Towel Shave', 'assets/images/beard-grooming.jpg', 'gallery'),
('gallery_3', 'Gallery: Japanese Convex Shears', 'assets/images/master-barber.jpg', 'gallery'),
('gallery_4', 'Gallery: Executive Pompadour', 'assets/images/classic-cut.jpg', 'gallery'),
('gallery_5', 'Gallery: Luxury Atelier Interior', 'assets/images/hero.jpg', 'gallery'),
('gallery_6', 'Gallery: Low Drop Fade', 'assets/images/fade-cut.jpg', 'gallery')
ON CONFLICT (image_key) DO UPDATE SET 
    label = EXCLUDED.label,
    image_url = EXCLUDED.image_url;
