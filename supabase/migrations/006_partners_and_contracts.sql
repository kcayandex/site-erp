-- Dynamic profit-sharing partners
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.partners (name, share_percentage) VALUES
  ('Ortak 1', 50),
  ('Ortak 2', 50);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_select" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "partners_insert" ON public.partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "partners_update" ON public.partners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "partners_delete" ON public.partners FOR DELETE TO authenticated USING (true);

-- Remove hardcoded check so paid_by can store 'kasa' or a partner UUID
ALTER TABLE public.company_expenses DROP CONSTRAINT IF EXISTS company_expenses_paid_by_check;

-- Contract period per site
ALTER TABLE public.sites ADD COLUMN contract_start_date DATE;
ALTER TABLE public.sites ADD COLUMN contract_end_date DATE;
