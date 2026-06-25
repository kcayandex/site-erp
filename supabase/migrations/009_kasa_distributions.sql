CREATE TABLE public.kasa_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_date DATE NOT NULL,
  partner_amounts JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kasa_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kasa_dist_select" ON public.kasa_distributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kasa_dist_insert" ON public.kasa_distributions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kasa_dist_update" ON public.kasa_distributions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "kasa_dist_delete" ON public.kasa_distributions FOR DELETE TO authenticated USING (true);
