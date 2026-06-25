-- Add superadmin to user_roles role constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'user', 'superadmin'));

-- Page visibility control per role
CREATE TABLE IF NOT EXISTS public.page_access (
  role TEXT NOT NULL,
  page_key TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (role, page_key)
);

ALTER TABLE public.page_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page_access_select" ON public.page_access FOR SELECT TO authenticated USING (true);

-- Default visibility for 'user' role (admin/superadmin always see everything)
INSERT INTO public.page_access (role, page_key, is_visible) VALUES
('user', 'dashboard', true),
('user', 'siteler', false),
('user', 'contractors', false),
('user', 'makbuzlar', true),
('user', 'aylik-ucretler', false),
('user', 'giderler', false),
('user', 'kasa', false),
('user', 'ortaklar', false)
ON CONFLICT (role, page_key) DO NOTHING;
