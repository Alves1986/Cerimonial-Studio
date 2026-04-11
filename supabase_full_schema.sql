-- ══════════════════════════════════════════════════════════════════════════════
-- CERIMONIAL STUDIO - FULL SAAS SCHEMA CONSOLIDATED
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'canceled',
    'incomplete', 'incomplete_expired',
    'past_due', 'unpaid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. CORE TABLES (AUTH & PROFILE)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cerimonialista_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_cont   TEXT,
  cpf_cont    TEXT,
  end_cont    TEXT,
  cidade_cont TEXT DEFAULT 'Telêmaco Borba / PR',
  tel_cont    TEXT,
  email_cont  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. BILLING TABLES (STRIPE SYNC)
CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT PRIMARY KEY,
  active      BOOLEAN,
  name        TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.prices (
  id                 TEXT PRIMARY KEY,
  product_id         TEXT REFERENCES products(id) ON DELETE CASCADE,
  active             BOOLEAN,
  currency           TEXT,
  unit_amount        BIGINT,
  type               TEXT,
  interval           TEXT,
  interval_count     INTEGER,
  trial_period_days  INTEGER,
  metadata           JSONB,
  created_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at         TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.customers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT NOT NULL UNIQUE,
  created_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                subscription_status NOT NULL,
  price_id              TEXT REFERENCES prices(id),
  quantity              INTEGER,
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  created               TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  cancel_at             TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  trial_start           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  metadata              JSONB,
  updated_at            TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. DOMAIN TABLES (APPLICATION DATA)
CREATE TABLE IF NOT EXISTS public.couples (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name1          TEXT NOT NULL,
  name2          TEXT NOT NULL,
  event_date     DATE,
  event_time     TIME,
  location       TEXT,
  whatsapp       TEXT,
  ceremony_type  TEXT,
  guests         INTEGER,
  package_type   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at     TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.planners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID NOT NULL UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details     JSONB DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key    TEXT NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(couple_id, task_key)
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID NOT NULL UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.roteiros (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID NOT NULL UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.cerimonialista_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cerimonialista profiles are viewable by owner" ON public.cerimonialista_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Cerimonialista profiles are updatable by owner" ON public.cerimonialista_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by authenticated" ON public.products FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices are viewable by authenticated" ON public.prices FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers are viewable by owner" ON public.customers FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscriptions are viewable by owner" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Couples are viewable by owner" ON public.couples FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.planners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planners are viewable by owner" ON public.planners FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checklists are viewable by owner" ON public.checklists FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contracts are viewable by owner" ON public.contracts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roteiros are viewable by owner" ON public.roteiros FOR ALL USING (auth.uid() = user_id);

-- 6. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cerimonialista_profiles_updated_at BEFORE UPDATE ON public.cerimonialista_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON public.prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planners_updated_at BEFORE UPDATE ON public.planners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roteiros_updated_at BEFORE UPDATE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. SAAS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_subscribed(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT p.name
     FROM public.subscriptions s
     JOIN public.prices pr ON pr.id = s.price_id
     JOIN public.products p ON p.id = pr.product_id
     WHERE s.user_id = user_uuid
       AND s.status IN ('active', 'trialing')
       AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
     ORDER BY s.created DESC
     LIMIT 1),
    'free'
  );
$$;

-- 8. AUTH TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.cerimonialista_profiles (id, email_cont)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
