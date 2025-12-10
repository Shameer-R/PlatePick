'use server';

/**
 * @fileOverview A meal plan generator AI agent that uses TheMealDB for recipes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchRecipesTool } from '../tools/themealdb';

// -------- Schemas --------
const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z.string(),
  cuisinePreferences: z.string(),
  numberOfMeals: z.number(),
  idToken: z.string(), // 🔐 REQUIRED FOR SERVER AUTH - but unused for now
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
    // NOTE: All Firebase Admin logic has been temporarily removed for debugging.
    
    // 1. Generate Meal Plan
    const { output } = await prompt(input);

    if (!output?.mealPlan) {
      throw new Error('Meal plan generation failed or returned no meals.');
    }
    
    const mealPlan = output.mealPlan;

    // 2. Return to client
    return { mealPlan };
  }
);
