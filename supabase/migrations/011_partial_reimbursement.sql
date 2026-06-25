ALTER TABLE public.company_expenses
  ADD COLUMN IF NOT EXISTS reimbursed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
