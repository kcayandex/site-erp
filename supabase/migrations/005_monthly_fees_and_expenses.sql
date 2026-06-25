-- Add monthly management fee to sites
ALTER TABLE public.sites
ADD COLUMN monthly_fee NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Monthly fee payment tracker (one row per site per month)
CREATE TABLE public.monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_at DATE,
  payment_method TEXT CHECK (payment_method IN ('nakit', 'havale')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT monthly_payments_site_year_month_unique UNIQUE (site_id, year, month)
);

-- KTurkey company expenses
CREATE TABLE public.company_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by TEXT NOT NULL DEFAULT 'kasa' CHECK (paid_by IN ('kasa', 'ortak1', 'ortak2')),
  reimbursed BOOLEAN NOT NULL DEFAULT false,
  reimbursed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for monthly_payments
ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_payments_select" ON public.monthly_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "monthly_payments_insert" ON public.monthly_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "monthly_payments_update" ON public.monthly_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "monthly_payments_delete" ON public.monthly_payments FOR DELETE TO authenticated USING (true);

-- RLS for company_expenses
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_expenses_select" ON public.company_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_expenses_insert" ON public.company_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "company_expenses_update" ON public.company_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "company_expenses_delete" ON public.company_expenses FOR DELETE TO authenticated USING (true);
