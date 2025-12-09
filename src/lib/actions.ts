'use server';

import { generateMealPlan, GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { MealPlanRequestSchema, type MealPlanRequestWithToken } from '@/lib/definitions';

type MealPlanState = {
  error?: string | null;
  mealPlan?: GenerateMealPlanOutput['mealPlan'] | null;
};

export async function createMealPlan(data: MealPlanRequestWithToken): Promise<MealPlanState> {
  const validatedFields = MealPlanRequestSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMessages = Object.entries(validatedFields.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return {
      error: `Invalid input: ${errorMessages}`,
    };
  }
  
  if(!data.idToken) {
    return {
      error: 'Authentication error. Please sign in again.'
    }
  }

  try {
    const result = await generateMealPlan({ ...validatedFields.data, idToken: data.idToken });
    return { mealPlan: result.mealPlan };
  } catch (error) {
    console.error('Error generating meal plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      error: `An unexpected error occurred while generating your meal plan. Please try again. Details: ${errorMessage}`,
    };
  }
}
