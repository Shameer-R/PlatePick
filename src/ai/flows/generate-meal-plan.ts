'use server';

/**
 * @fileOverview A meal plan generator AI agent.
 *
 * - generateMealPlan - A function that handles the meal plan generation process.
 * - GenerateMealPlanInput - The input type for the generateMealPlan function.
 * - GenerateMealPlanOutput - The return type for the generateMealPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('Any dietary restrictions the user has (e.g., vegetarian, gluten-free, dairy-free).'),
  cuisinePreferences: z
    .string()
    .describe('The user’s preferred cuisine types (e.g., Italian, Mexican, Asian).'),
  numberOfMeals: z.number().describe('The number of meals to include in the meal plan.'),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const GenerateMealPlanOutputSchema = z.object({
  mealPlan: z.string().describe('A detailed meal plan based on the user input.'),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: {schema: GenerateMealPlanInputSchema},
  output: {schema: GenerateMealPlanOutputSchema},
  prompt: `You are a personal meal planning assistant. Please generate a meal plan for the user based on their dietary restrictions, cuisine preferences, and the number of meals they want in the plan.

Dietary Restrictions: {{{dietaryRestrictions}}}
Cuisine Preferences: {{{cuisinePreferences}}}
Number of Meals: {{{numberOfMeals}}}

Make sure each meal is easily reproducible at home, and include nutritional information for each.
`,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
