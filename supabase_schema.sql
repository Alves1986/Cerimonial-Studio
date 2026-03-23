-- Create tables for Cerimonial Studio

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Couples table
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name1 TEXT NOT NULL,
  name2 TEXT NOT NULL,
  event_date DATE,
  event_time TIME,
  location TEXT,
  guests INTEGER,
  package_type TEXT,
  notes TEXT,
  whatsapp TEXT,
  ceremony_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Planners table
CREATE TABLE IF NOT EXISTS public.planners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Checklists table
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  task_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(couple_id, task_key)
);

-- Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  data JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Couples: Users can only see and edit their own couples
CREATE POLICY "Users can view own couples" ON public.couples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own couples" ON public.couples FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own couples" ON public.couples FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own couples" ON public.couples FOR DELETE USING (auth.uid() = user_id);

-- Planners: Users can only see and edit their own planners
CREATE POLICY "Users can view own planners" ON public.planners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planners" ON public.planners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planners" ON public.planners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planners" ON public.planners FOR DELETE USING (auth.uid() = user_id);

-- Checklists: Users can only see and edit their own checklists
CREATE POLICY "Users can view own checklists" ON public.checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklists" ON public.checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON public.checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklists" ON public.checklists FOR DELETE USING (auth.uid() = user_id);

-- Contracts: Users can only see and edit their own contracts
CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);
