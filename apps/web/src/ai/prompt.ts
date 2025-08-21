import { supabase } from '../lib/supabase';
import { Plan, PlanSchema } from '../types/plan';
import { PLAN_JSON_PROMPT } from './systemPrompts';

export class PlanGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'PlanGenerationError';
  }
}

export async function generatePlan({ 
  idea, 
  lang 
}: { 
  idea: string; 
  lang: 'en' | 'es' 
}): Promise<Plan> {
  try {
    const { data, error } = await supabase.functions.invoke('prompt', {
      body: { 
        input: idea, 
        lang, 
        system: PLAN_JSON_PROMPT 
      }
    });

    if (error) {
      throw new PlanGenerationError(`Edge function error: ${error.message}`, error);
    }

    if (!data) {
      throw new PlanGenerationError('No response from AI service');
    }

    let planData;
    try {
      // The Edge Function now returns JSON string directly
      if (typeof data === 'string') {
        // Try to parse as JSON, handling potential markdown code blocks
        const cleanedData = data.replace(/```json\n?/, '').replace(/\n?```/, '');
        planData = JSON.parse(cleanedData);
      } else {
        // If data is already an object, use it directly
        planData = data;
      }
    } catch (parseError) {
      console.error('Raw response data:', data);
      throw new PlanGenerationError('Invalid JSON response from AI', parseError as Error);
    }

    const result = PlanSchema.safeParse(planData);
    if (!result.success) {
      throw new PlanGenerationError(
        `Invalid plan structure: ${result.error.message}`,
        result.error
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof PlanGenerationError) {
      throw error;
    }
    throw new PlanGenerationError('Failed to generate plan', error as Error);
  }
}