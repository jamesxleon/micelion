-- Add description column to milestones table
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';