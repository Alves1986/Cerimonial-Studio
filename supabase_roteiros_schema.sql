-- Roteiros table
CREATE TABLE IF NOT EXISTS public.roteiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  data JSONB DEFAULT '[]'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(couple_id)
);

-- RLS
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roteiros" ON public.roteiros FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roteiros" ON public.roteiros FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roteiros" ON public.roteiros FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roteiros" ON public.roteiros FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_roteiros_updated_at BEFORE UPDATE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
