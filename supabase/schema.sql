-- ====================================================================
-- EPSELON ACADEMIC INTELLIGENCE - COMPLETE SUPABASE DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ====================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS / PROFILES TABLE
-- Linked directly to Supabase Auth (`auth.users`)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  country TEXT DEFAULT 'United States',
  university TEXT DEFAULT 'Stanford University',
  faculty TEXT DEFAULT 'Sciences',
  department TEXT DEFAULT 'Physics',
  academic_level TEXT DEFAULT 'PhD Candidate',
  preferred_language TEXT DEFAULT 'English',
  learning_style TEXT DEFAULT 'Visual',
  weekly_commitment TEXT DEFAULT '5-10',
  learning_objectives TEXT DEFAULT '',
  mastery_progress INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 1,
  cards_mastered INTEGER DEFAULT 0,
  total_cards INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "theme": "obsidian",
    "accentColor": "blue",
    "fontSize": "100%",
    "teachingStyle": "Socratic",
    "cognitiveLoad": "Proficient",
    "taxonomyFocus": "Analyze & Evaluate",
    "contextAwareness": true
  }'::jsonb,
  providers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration TEXT DEFAULT '25m',
  mastery_score INTEGER DEFAULT 0,
  concepts_covered JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FLASHCARDS TABLE (Leitner System)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT DEFAULT 'General',
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  box INTEGER DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  last_reviewed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KNOWLEDGE GRAPH NODES TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  subject TEXT DEFAULT 'General',
  mastery_level FLOAT DEFAULT 0.5 CHECK (mastery_level BETWEEN 0 AND 1),
  decay_rate FLOAT DEFAULT 0.05,
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  connected_concepts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONTINUOUS CHAT SESSIONS & MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  provider_id TEXT NOT NULL DEFAULT 'system',
  model_id TEXT NOT NULL DEFAULT 'system-gemini-flash',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data privacy: Users can only view, edit, or delete their own records.
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- STUDY SESSIONS POLICIES
CREATE POLICY "Users can manage own study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FLASHCARDS POLICIES
CREATE POLICY "Users can manage own flashcards"
  ON public.flashcards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- KNOWLEDGE NODES POLICIES
CREATE POLICY "Users can manage own knowledge nodes"
  ON public.knowledge_nodes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can manage own chat history"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC AUTH TRIGGER (Creates user profile upon signup)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Academic Scholar')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
