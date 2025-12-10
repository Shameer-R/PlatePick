'use server';

/**
 * @fileOverview A meal plan generator AI agent that uses TheMealDB for recipes.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchRecipesTool } from '../tools/themealdb';

// Firebase Admin SDK Initialization
// Initialize only if it hasn't been initialized yet.
if (!getApps().length) {
  // When deployed to a Google Cloud environment, the SDK will automatically
  // use the project's service account credentials.
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

// -------- Schemas --------
const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z.string(),
  cuisinePreferences: z.string(),
  numberOfMeals: z.number(),
  idToken: z.string(),
});

export type GenerateMealPlanInput = z.infer<
  typeof GenerateMealPlanInputSchema
>;

const MealSchema = z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.string(),
    calories: z.number().optional(),
    macros: z.string().optional(),
    imageUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
});

const GenerateMealPlanOutputSchema = z.object({
  mealPlan: z.array(MealSchema),
});

export type GenerateMealPlanOutput = z.infer<
  typeof GenerateMealPlanOutputSchema
>;

// -------- Public Function --------
export async function generateMealPlan(
  input: GenerateMealPlanInput
): Promise<GenerateMealPlanOutput> {
  // This is a wrapper to add detailed error handling.
  try {
    return await generateMealPlanFlow(input);
  } catch (e: any) {
    console.error('CRITICAL: An unhandled error occurred in generateMealPlanFlow.', {
      errorMessage: e.message,
      errorStack: e.stack,
      errorDetails: e.cause, // Genkit often wraps underlying errors here
    });

    // Re-throw a more user-friendly error to the client action
    throw new Error(
      `AI flow failed. Original error: ${e.message}. Check server logs for full details.`
    );
  }
}

// -------- AI Prompt --------
const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: { schema: Omit<z.ZodType<GenerateMealPlanInput>, 'idToken'> },
  output: { schema: GenerateMealPlanOutputSchema },
  tools: [searchRecipesTool],
  prompt: `
You are a personal meal planning assistant. Your goal is to generate a meal plan with {{numberOfMeals}} unique meals based on the user's preferences.

User Preferences:
- Dietary Restrictions: {{dietaryRestrictions}}
- Cuisine Preferences: {{cuisinePreferences}}

Instructions:
1.  Based on the cuisine preferences and dietary restrictions, come up with search queries to find suitable recipes. For example, if the user wants "Italian" and "Vegetarian", you could search for "Vegetarian Lasagna".
2.  Use the \`searchRecipes\` tool to find real recipes for each meal.
3.  From the search results, select a variety of meals that best fit the user's request. DO NOT use the same meal twice.
4.  For each selected meal, populate the output with its details (name, ingredients, instructions, imageUrl, sourceUrl).
5.  Also provide an estimated calorie count and macros for each meal.
6.  Return the final plan as a structured JSON object. Ensure you generate exactly {{numberOfMeals}} meals.
`,
});

// -------- Main Flow --------
const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async (input) => {
    // 1. Authenticate the user
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(input.idToken);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('User authentication failed. Please sign in again.');
    }
    const userId = decodedToken.uid;
    
    // 2. Generate Meal Plan
    const { output } = await prompt(input);

    if (!output?.mealPlan) {
      throw new Error('Meal plan generation failed or returned no meals.');
    }
    
    const mealPlan = output.mealPlan;

    // 3. Save to Firestore
    try {
      await db.collection('meal_plans').add({
        userId: userId,
        createdAt: new Date(),
        meals: mealPlan,
        preferencesSnapshot: {
          dietaryRestrictions: input.dietaryRestrictions,
          cuisinePreferences: input.cuisinePreferences,
          numberOfMeals: input.numberOfMeals,
        },
      });
    } catch (error) {
      console.error('Firestore save failed:', error);
      // We don't throw an error here, as the meal plan was still generated.
      // The user gets their plan, but we log the save failure.
    }

    // 4. Return to client
    return { mealPlan };
  }
);
