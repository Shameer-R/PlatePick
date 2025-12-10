'use server';

import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { generateMealPlan, GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { MealPlanRequestSchema, type MealPlanRequest } from '@/lib/definitions';


type MealPlanState = {
  error?: string | null;
  mealPlan?: GenerateMealPlanOutput['mealPlan'] | null;
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
    return { mealPlan: result.mealPlan };
  } catch (error) {
    console.error('Error in createMealPlan server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      error: `Failed to generate meal plan. Details: ${errorMessage}`,
    };
  }
}

type SavePlanState = {
  error?: string | null;
  success?: boolean;
};

interface SaveMealPlanData {
  idToken: string;
  mealPlan: GenerateMealPlanOutput['mealPlan'];
  request: MealPlanRequest;
}

export async function saveMealPlan(data: SaveMealPlanData): Promise<SavePlanState> {
  let userId;
  try {
    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(data.idToken);
    userId = decodedToken.uid;
  } catch (error: any) {
    console.error('Auth error in saveMealPlan:', error);
    return { error: 'Authentication failed. Could not save meal plan.' };
  }

  try {
    const { db } = getFirebaseAdmin();
    await db.collection('meal_plans').add({
      userId: userId,
      createdAt: new Date(),
      meals: data.mealPlan,
      preferencesSnapshot: data.request,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Firestore save error in saveMealPlan:', error);
    return { error: 'Failed to save meal plan to the database.' };
  }
}
