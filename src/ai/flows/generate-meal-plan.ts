'use server';

/**
 * @fileOverview A meal plan generator AI agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// -------- Firebase Admin (Server Safe Auth) --------
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
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

const GenerateMealPlanOutputSchema = z.object({
  mealPlan: z.string().describe('A detailed meal plan'),
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
  prompt: `
You are a personal meal planning assistant. 
Generate {{numberOfMeals}} meals based on:

Dietary restrictions: {{dietaryRestrictions}}
Cuisine preferences: {{cuisinePreferences}}

For each meal include:
- Name
- Ingredients (with name + nutrition object)
- Short instructions
- Calories and macros

Return the plan as readable structured text.
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

    if (!output) {
      throw new Error('Meal plan generation failed');
    }

    // 3. Get user preferences from uid collection
    const userDoc = await db.collection('uid').doc(userId).get();
    const preferencesSnapshot = userDoc.exists
      ? userDoc.data()?.preferences ?? {}
      : {};

    // 4. Save PLAN to meal_plans collection
    const planRef = await db.collection('meal_plans').add({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      meals: output.mealPlan, // stored as string for now
      preferencesSnapshot,
    });

    const planId = planRef.id;

    // 5. Save each meal to saved_recipes collection
    // (Simple parser based on meal sections)
    const meals = output.mealPlan
      .split('\n\n')
      .filter((m) => m.trim().length > 0);

    for (const meal of meals) {
      await db.collection('saved_recipes').add({
        Meal: {
          rawText: meal,
          ingredients: [], 
        },
        originalPlanId: planId,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        userNotes: '',
      });
    }

    // 6. Return to client
    return output;
  }
);
