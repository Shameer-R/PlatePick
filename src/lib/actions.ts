'use server';

import { generateMealPlan } from '@/ai/flows/generate-meal-plan';
import { MealPlanRequestSchema, type MealPlanRequestWithToken } from '@/lib/definitions';
import { z } from 'zod';

type MealPlanState = {
  error?: string | null;
  mealPlan?: string | null;
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
    return {
      error: 'An unexpected error occurred while generating your meal plan. Please try again.',
    };
  }
}
