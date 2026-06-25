CREATE TABLE public.kasa_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL,
  total_distributed NUMERIC(12, 2),
  notes TEXT,
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

ALTER TABLE public.kasa_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select" ON public.kasa_settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "settlements_insert" ON public.kasa_settlements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settlements_update" ON public.kasa_settlements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "settlements_delete" ON public.kasa_settlements FOR DELETE TO authenticated USING (true);
