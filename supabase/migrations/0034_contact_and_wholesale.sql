-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for contact_inquiries
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert inquiries
CREATE POLICY "Anyone can insert contact inquiries"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Allow only admins to select inquiries
CREATE POLICY "Admins can view contact inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- Create wholesale_applications table
CREATE TABLE IF NOT EXISTS public.wholesale_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for wholesale_applications
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert applications
CREATE POLICY "Anyone can insert wholesale applications"
  ON public.wholesale_applications FOR INSERT
  WITH CHECK (true);

-- Allow only admins to select and update applications
CREATE POLICY "Admins can view wholesale applications"
  ON public.wholesale_applications FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update wholesale applications"
  ON public.wholesale_applications FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
