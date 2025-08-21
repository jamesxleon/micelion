import { z } from 'zod';

export const ResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['article', 'video', 'course', 'book', 'doc']).optional(),
});

export const MilestonePlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  resources: z.array(ResourceSchema),
});

export const PlanSchema = z.object({
  project_title: z.string(),
  briefing: z.string(),
  skills: z.array(z.string()),
  milestones: z.array(MilestonePlanSchema),
});

export type Resource = z.infer<typeof ResourceSchema>;
export type MilestonePlan = z.infer<typeof MilestonePlanSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export interface Milestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  skills: string[];
  resources: Resource[];
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  milestone_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}