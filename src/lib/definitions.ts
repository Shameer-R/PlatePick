import { z } from 'zod';

export const MealPlanRequestSchema = z.object({
  dietaryRestrictions: z.string().min(1, 'Please specify at least one dietary preference or restriction.'),
  cuisinePreferences: z.string().min(1, 'Please specify at least one cuisine preference.'),
  numberOfMeals: z.coerce.number().min(1, 'Please select the number of meals.').max(10, 'Please select 10 or fewer meals.'),
});

export type MealPlanRequest = z.infer<typeof MealPlanRequestSchema>;
