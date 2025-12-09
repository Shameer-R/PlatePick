'use server';

import { generateMealPlan } from '@/ai/flows/generate-meal-plan';
import { MealPlanRequestSchema, type MealPlanRequest } from '@/lib/definitions';
import { z } from 'zod';

type MealPlanState = {
  error?: string | null;
  mealPlan?: string | null;
};

export async function createMealPlan(data: MealPlanRequest): Promise<MealPlanState> {
  const validatedFields = MealPlanRequestSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMessages = Object.entries(validatedFields.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return {
      error: `Invalid input: ${errorMessages}`,
    };
  }

  try {
    const result = await generateMealPlan(validatedFields.data);
    // In a real app, you would save the result.mealPlan to Firestore here.
    return { mealPlan: result.mealPlan };
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return {
      error: 'An unexpected error occurred while generating your meal plan. Please try again.',
    };
  }
}
