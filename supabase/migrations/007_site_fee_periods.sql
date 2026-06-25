-- Fee periods per site: tracks price changes over contract lifetime
CREATE TABLE public.site_fee_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  monthly_fee NUMERIC(12, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, effective_from)
);

ALTER TABLE public.site_fee_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_periods_select" ON public.site_fee_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "fee_periods_insert" ON public.site_fee_periods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fee_periods_update" ON public.site_fee_periods FOR UPDATE TO authenticated USING (true);
CREATE POLICY "fee_periods_delete" ON public.site_fee_periods FOR DELETE TO authenticated USING (true);

-- Seed initial periods from existing site monthly_fee values
INSERT INTO public.site_fee_periods (site_id, effective_from, monthly_fee, note)
SELECT
  id,
  COALESCE(contract_start_date, '2024-01-01'::date),
  COALESCE(monthly_fee, 0),
  'Başlangıç ücreti'
FROM public.sites
WHERE monthly_fee > 0;
