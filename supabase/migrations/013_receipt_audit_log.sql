CREATE TABLE IF NOT EXISTS public.receipt_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID,
  receipt_no TEXT,
  action TEXT NOT NULL, -- 'insert', 'update', 'delete'
  changed_by UUID,
  changed_by_email TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  summary TEXT
);

ALTER TABLE public.receipt_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read"
  ON public.receipt_audit_logs FOR SELECT
  TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.log_receipt_change()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_summary TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_summary := 'Islenen: ' || NEW.total_islenen::TEXT;
    INSERT INTO public.receipt_audit_logs
      (receipt_id, receipt_no, action, changed_by, changed_by_email, summary)
    VALUES (NEW.id, NEW.receipt_no, 'insert', auth.uid(), v_email, v_summary);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_summary := 'Islenen: ' || NEW.total_islenen::TEXT;
    INSERT INTO public.receipt_audit_logs
      (receipt_id, receipt_no, action, changed_by, changed_by_email, summary)
    VALUES (NEW.id, NEW.receipt_no, 'update', auth.uid(), v_email, v_summary);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_summary := 'Islenen: ' || OLD.total_islenen::TEXT;
    INSERT INTO public.receipt_audit_logs
      (receipt_id, receipt_no, action, changed_by, changed_by_email, summary)
    VALUES (OLD.id, OLD.receipt_no, 'delete', auth.uid(), v_email, v_summary);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS receipt_audit_trigger ON public.receipts;

CREATE TRIGGER receipt_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.log_receipt_change();
