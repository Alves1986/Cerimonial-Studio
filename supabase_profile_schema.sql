-- Tabela para o perfil do cerimonialista
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

-- RLS
ALTER TABLE public.cerimonialista_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cerimonialista profile"
  ON public.cerimonialista_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own cerimonialista profile"
  ON public.cerimonialista_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own cerimonialista profile"
  ON public.cerimonialista_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para updated_at
CREATE TRIGGER update_cerimonialista_profiles_updated_at
  BEFORE UPDATE ON public.cerimonialista_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
