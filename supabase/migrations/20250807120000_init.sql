-- Enum type for milestone status
DO $$ BEGIN 
  CREATE TYPE milestone_status AS ENUM ('pending','in_progress','done'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles table (linked to Supabase auth.users table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Projects table (each project belongs to a user/profile)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Milestones table (each milestone belongs to a project and user)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Notes table (notes can be attached to a project and optionally a milestone)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID NULL REFERENCES public.milestones(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Trigger function to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.touch_updated_at() 
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to each table (before update)
CREATE OR REPLACE TRIGGER trg_touch_profiles 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE TRIGGER trg_touch_projects 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE TRIGGER trg_touch_milestones 
  BEFORE UPDATE ON public.milestones 
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE TRIGGER trg_touch_notes 
  BEFORE UPDATE ON public.notes 
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Automatic profile creation on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN 
  INSERT INTO public.profiles (id) VALUES (NEW.id) 
    ON CONFLICT (id) DO NOTHING; 
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Row Level Security Policies:

-- Profile: user can select and update their own profile
CREATE POLICY "own_profile_select" ON public.profiles
FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Projects: user can do anything on projects where user_id = their uid
CREATE POLICY "own_projects_all" ON public.projects
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Milestones: user can do anything on milestones where user_id = their uid
CREATE POLICY "own_milestones_all" ON public.milestones
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notes: user can do anything on notes that belong to their project and are their own
CREATE POLICY "own_notes_all" ON public.notes
FOR ALL USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
) WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- Helpful indexes for performance on foreign key lookups:
CREATE INDEX IF NOT EXISTS idx_projects_user   ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_proj ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_user      ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_project   ON public.notes(project_id);

