'use server';
/**
 * @fileOverview A Genkit tool for interacting with TheMealDB API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MealDBSearchResultSchema = z.object({
  meals: z.array(
    z.object({
      idMeal: z.string(),
      strMeal: z.string(),
      strInstructions: z.string(),
      strMealThumb: z.string(),
      strSource: z.string().nullable(),
      strIngredient1: z.string().nullable(),
      strIngredient2: z.string().nullable(),
      strIngredient3: z.string().nullable(),
      strIngredient4: z.string().nullable(),
      strIngredient5: z.string().nullable(),
      strIngredient6: z.string().nullable(),
      strIngredient7: z.string().nullable(),
      strIngredient8: z.string().nullable(),
      strIngredient9: z.string().nullable(),
      strIngredient10: z.string().nullable(),
      strIngredient11: z.string().nullable(),
      strIngredient12: z.string().nullable(),
      strIngredient13: z.string().nullable(),
      strIngredient14: z.string().nullable(),
      strIngredient15: z.string().nullable(),
      strIngredient16: z.string().nullable(),
      strIngredient17: z.string().nullable(),
      strIngredient18: z.string().nullable(),
      strIngredient19: z.string().nullable(),
      strIngredient20: z.string().nullable(),
      strMeasure1: z.string().nullable(),
      strMeasure2: z.string().nullable(),
      strMeasure3: z.string().nullable(),
      strMeasure4: z.string().nullable(),
      strMeasure5: z.string().nullable(),
      strMeasure6: z.string().nullable(),
      strMeasure7: z.string().nullable(),
      strMeasure8: z.string().nullable(),
      strMeasure9: z.string().nullable(),
      strMeasure10: z.string().nullable(),
      strMeasure11: z.string().nullable(),
      strMeasure12: z.string().nullable(),
      strMeasure13: z.string().nullable(),
      strMeasure14: z.string().nullable(),
      strMeasure15: z.string().nullable(),
      strMeasure16: z.string().nullable(),
      strMeasure17: z.string().nullable(),
      strMeasure18: z.string().nullable(),
      strMeasure19: z.string().nullable(),
      strMeasure20: z.string().nullable(),
    })
  ).nullable(),
});


function formatIngredients(meal: z.infer<typeof MealDBSearchResultSchema>['meals'][0]): string[] {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}` as keyof typeof meal];
        const measure = meal[`strMeasure${i}` as keyof typeof meal];
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push(`${measure} ${ingredient}`);
        }
    }
    return ingredients;
}

export const searchRecipesTool = ai.defineTool(
  {
    name: 'searchRecipes',
    description: 'Search for recipes on TheMealDB. Can be used to find meals based on a query string.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.object({
        name: z.string(),
        instructions: z.string(),
        imageUrl: z.string(),
        sourceUrl: z.string().optional(),
        ingredients: z.array(z.string()),
    })),
  },
  async (input) => {
    console.log(`Searching for recipes with query: ${input.query}`);
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${input.query}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.statusText}`);
    }
    const data = await response.json();
    const validated = MealDBSearchResultSchema.safeParse(data);

    if (!validated.success || !validated.data.meals) {
      console.log('No meals found or validation failed for query:', input.query);
      return [];
    }

    return validated.data.meals.map((meal) => ({
      name: meal.strMeal,
      instructions: meal.strInstructions,
      imageUrl: meal.strMealThumb,
      sourceUrl: meal.strSource || undefined,
      ingredients: formatIngredients(meal),
    })).slice(0, 5); // Return top 5 results
  }
);
