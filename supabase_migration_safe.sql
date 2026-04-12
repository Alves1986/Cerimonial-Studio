-- SCRIPT DE MIGRAÇÃO SEGURA - CERIMONIAL STUDIO SAAS
-- Este script ajusta as tabelas existentes para o novo sistema SaaS sem apagar dados.

-- 1. Garantir que as tabelas de Stripe existam com as colunas corretas
-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Tabela de Preços
CREATE TABLE IF NOT EXISTS public.prices (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(id),
  active boolean,
  currency text,
  type text,
  unit_amount bigint,
  interval text,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Tabela de Clientes (Mapeamento Supabase <-> Stripe)
CREATE TABLE IF NOT EXISTS public.customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  stripe_customer_id text UNIQUE,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  status text,
  metadata jsonb,
  price_id text REFERENCES public.prices(id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone DEFAULT timezone('utc'::text, now()),
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()),
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Ajustar tabelas de negócio (Couples, Planners, Checklists)
-- Adicionar user_id se não existir (essencial para RLS)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couples' AND column_name='user_id') THEN
        ALTER TABLE public.couples ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planners' AND column_name='user_id') THEN
        ALTER TABLE public.planners ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='checklists' AND column_name='user_id') THEN
        ALTER TABLE public.checklists ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Habilitar RLS (Row Level Security) para segurança SaaS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso (Policies)
-- Produtos e Preços: Todos podem ler
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.prices;
CREATE POLICY "Allow public read access" ON public.prices FOR SELECT USING (true);

-- Assinaturas: Usuário só vê a sua
DROP POLICY IF EXISTS "Can only view own subs" ON public.subscriptions;
CREATE POLICY "Can only view own subs" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Dados de Negócio: Usuário só vê/edita o que é dele
DROP POLICY IF EXISTS "Users can manage own couples" ON public.couples;
CREATE POLICY "Users can manage own couples" ON public.couples ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own planners" ON public.planners;
CREATE POLICY "Users can manage own planners" ON public.planners ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own checklists" ON public.checklists;
CREATE POLICY "Users can manage own checklists" ON public.checklists ALL USING (auth.uid() = user_id);

-- 5. Função RPC para verificar o plano do usuário (Usada pelo Frontend)
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid uuid)
RETURNS text AS $$
DECLARE
  plan_name text;
BEGIN
  SELECT 
    p.name INTO plan_name
  FROM 
    subscriptions s
  JOIN 
    prices pr ON s.price_id = pr.id
  JOIN 
    products p ON pr.product_id = p.id
  WHERE 
    s.user_id = user_uuid 
    AND s.status = 'active'
  ORDER BY 
    s.created DESC
  LIMIT 1;

  IF plan_name IS NULL THEN
    RETURN 'free';
  ELSE
    RETURN plan_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para contar casais (Usada para limites do plano)
CREATE OR REPLACE FUNCTION public.get_couples_count(user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (SELECT count(*)::integer FROM public.couples WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
