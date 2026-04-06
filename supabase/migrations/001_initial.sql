-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sites_abbreviation_unique UNIQUE (abbreviation)
);

-- Receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  receipt_no TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_islenen NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_odenen NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_words TEXT,
  customer_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT receipts_receipt_no_unique UNIQUE (receipt_no),
  CONSTRAINT receipts_site_year_seq_unique UNIQUE (site_id, serial_no, sequence_no)
);

-- User roles table
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get next sequence number for a site+year
CREATE OR REPLACE FUNCTION public.get_next_sequence(p_site_id UUID, p_serial_no TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_no), 0) + 1
  INTO next_seq
  FROM public.receipts
  WHERE site_id = p_site_id AND serial_no = p_serial_no;

  RETURN next_seq;
END;
$$;

-- RLS Policies
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Sites policies: all authenticated users can read, all can write (admin check at app level)
CREATE POLICY "sites_select" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "sites_insert" ON public.sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sites_update" ON public.sites FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sites_delete" ON public.sites FOR DELETE TO authenticated USING (true);

-- Receipts policies: all authenticated users can CRUD
CREATE POLICY "receipts_select" ON public.receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "receipts_insert" ON public.receipts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "receipts_update" ON public.receipts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "receipts_delete" ON public.receipts FOR DELETE TO authenticated USING (true);

-- User roles: users can read their own role
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (true);
