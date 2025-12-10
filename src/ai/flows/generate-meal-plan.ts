'use server';

/**
 * @fileOverview A meal plan generator AI agent that uses TheMealDB for recipes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchRecipesTool } from '../tools/themealdb';

// -------- Firebase Admin (Server Safe Auth) --------
import admin from 'firebase-admin';

// In a deployed Google Cloud environment (like App Hosting or Cloud Functions),
// initializeApp() automatically finds the service account credentials.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// -------- Schemas --------
const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z.string(),
  cuisinePreferences: z.string(),
  numberOfMeals: z.number(),
  idToken: z.string(), // 🔐 REQUIRED FOR SERVER AUTH
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
  return generateMealPlanFlow(input);
}

// -------- AI Prompt --------
const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: { schema: GenerateMealPlanInputSchema },
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
    // 1. Verify user identity using token
    const decodedToken = await auth.verifyIdToken(input.idToken);
    const userId = decodedToken.uid;

    // 2. Generate Meal Plan
    const { output } = await prompt(input);

    if (!output?.mealPlan) {
      throw new Error('Meal plan generation failed or returned no meals.');
    }
    
    const mealPlan = output.mealPlan;

    // 3. Get user preferences from uid collection
    const userDoc = await db.collection('users').doc(userId).get();
    const preferencesSnapshot = userDoc.exists
      ? userDoc.data()?.preferences ?? {}
      : {};

    // 4. Save the entire PLAN to meal_plans collection
    const planRef = await db.collection('meal_plans').add({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      meals: mealPlan, // Store the array of meal objects
      preferencesSnapshot,
    });

    const planId = planRef.id;

    // 5. Save each individual meal to saved_recipes collection
    for (const meal of mealPlan) {
      await db.collection('saved_recipes').add({
        meal, // store the meal object
        originalPlanId: planId,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        userNotes: '',
      });
    }

    // 6. Return to client
    return { mealPlan };
  }
);
