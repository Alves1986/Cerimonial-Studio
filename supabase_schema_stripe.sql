-- ══════════════════════════════════════
-- BLOCO 1: ENUM subscription_status
-- ══════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'canceled',
    'incomplete', 'incomplete_expired',
    'past_due', 'unpaid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════
-- BLOCO 2: TABELAS (products → prices →
--          customers → subscriptions →
--          suppliers → cortege)
-- ══════════════════════════════════════

-- 1. products
CREATE TABLE products (
  id          TEXT PRIMARY KEY,
  active      BOOLEAN,
  name        TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. prices
CREATE TABLE prices (
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

-- 3. customers
CREATE TABLE customers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT NOT NULL UNIQUE,
  created_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. subscriptions
CREATE TABLE subscriptions (
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

-- 5. suppliers
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id   UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  name        TEXT,
  phone       TEXT,
  email       TEXT,
  instagram   TEXT,
  confirmed   BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. cortege
CREATE TABLE cortege (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id   UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  role        TEXT NOT NULL,
  names       TEXT,
  music       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cortege_couple_position_unique UNIQUE (couple_id, position)
);

-- ══════════════════════════════════════
-- BLOCO 3: RLS E POLICIES
-- ══════════════════════════════════════

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to products" ON products USING (auth.role() = 'service_role');

-- prices
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to prices" ON prices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to prices" ON prices USING (auth.role() = 'service_role');

-- customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own customer data" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow service_role full access to customers" ON customers USING (auth.role() = 'service_role');

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow service_role full access to subscriptions" ON subscriptions USING (auth.role() = 'service_role');

-- suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users full access to their own suppliers" ON suppliers USING (auth.uid() = user_id);

-- cortege
ALTER TABLE cortege ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users full access to their own cortege" ON cortege USING (auth.uid() = user_id);

-- ══════════════════════════════════════
-- BLOCO 4: TRIGGER updated_at
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cortege_updated_at BEFORE UPDATE ON cortege FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════
-- BLOCO 5: ÍNDICES
-- ══════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_couple_id ON suppliers(couple_id);

CREATE INDEX IF NOT EXISTS idx_cortege_couple_id ON cortege(couple_id, position);

-- ══════════════════════════════════════
-- BLOCO 6: FUNÇÕES is_subscribed e get_user_plan
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION is_subscribed(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL
           OR current_period_end > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT p.name
     FROM subscriptions s
     JOIN prices pr ON pr.id = s.price_id
     JOIN products p ON p.id = pr.product_id
     WHERE s.user_id = user_uuid
       AND s.status IN ('active', 'trialing')
       AND (s.current_period_end IS NULL
            OR s.current_period_end > NOW())
     ORDER BY s.created DESC
     LIMIT 1),
    'free'
  );
$$;

-- ══════════════════════════════════════
-- BLOCO 7: TRIGGER handle_new_user → profiles
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger caso já exista para evitar duplicação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════════════
-- BLOCO 8: SEED produtos e preços
-- ══════════════════════════════════════
INSERT INTO products (id, active, name, description) VALUES
  ('prod_basico', true, 'Plano Básico',
   'Gestão de até 10 casais, planner e checklist'),
  ('prod_pro', true, 'Plano Pro',
   'Casais ilimitados, contrato, fornecedores e cortejo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO prices
  (id, product_id, active, currency, unit_amount, type,
   interval, interval_count) VALUES
  ('price_basico_monthly', 'prod_basico', true, 'brl',
   4900, 'recurring', 'month', 1),
  ('price_pro_monthly', 'prod_pro', true, 'brl',
   9900, 'recurring', 'month', 1)
ON CONFLICT (id) DO NOTHING;
