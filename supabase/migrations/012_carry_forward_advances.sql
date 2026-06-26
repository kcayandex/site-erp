-- Feature 1: Devreden kasa bakiyesi için closing_balance kolonu
ALTER TABLE public.kasa_settlements
  ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Feature 4: Ortak avans takibi
CREATE TABLE IF NOT EXISTS public.partner_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_advances_all"
  ON public.partner_advances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
