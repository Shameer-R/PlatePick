'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createMealPlan, saveMealPlan } from '@/lib/actions';
import { MealPlanRequestSchema, type MealPlanRequest } from '@/lib/definitions';
import { useAuth } from '@/hooks/use-auth.tsx';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';

interface MealPlanFormProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setMealPlan: (plan: GenerateMealPlanOutput['mealPlan'] | null) => void;
}

export function MealPlanForm({ isLoading, setIsLoading, setMealPlan }: MealPlanFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof MealPlanRequestSchema>>({
    resolver: zodResolver(MealPlanRequestSchema),
    defaultValues: {
      dietaryRestrictions: '',
      cuisinePreferences: '',
      numberOfMeals: 5,
    },
  });

  useEffect(() => {
    const diet = searchParams.get('diet');
    const cuisine = searchParams.get('cuisine');
    const meals = searchParams.get('meals');

    if (diet) {
      form.setValue('dietaryRestrictions', diet);
    }
    if (cuisine) {
      form.setValue('cuisinePreferences', cuisine);
    }
    if (meals) {
      form.setValue('numberOfMeals', Number(meals));
    }
  }, [searchParams, form]);


  async function onSubmit(values: z.infer<typeof MealPlanRequestSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a meal plan.',
      });
      return;
    }

    setIsLoading(true);
    setMealPlan(null);

    // Step 1: Generate the meal plan
    const result = await createMealPlan(values);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Plan',
        description: result.error,
      });
      setIsLoading(false);
      return;
    } 
    
    if (result.mealPlan) {
      setMealPlan(result.mealPlan);
      toast({
        title: 'Success!',
        description: 'Your meal plan has been generated.',
      });

      // Step 2: Save the meal plan in the background
      try {
        const idToken = await user.getIdToken();
        const saveResult = await saveMealPlan({
          idToken,
          mealPlan: result.mealPlan,
          request: values,
        });
        if (saveResult.error) {
           toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the plan to your history.',
          });
        }
      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the plan to your history.',
          });
      }
      
      form.reset();
    }
    
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">New Meal Plan</CardTitle>
        <CardDescription>Tell us your preferences and let our AI do the planning.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="dietaryRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Vegetarian, Gluten-Free, nut allergy" {...field} />
                  </FormControl>
                  <FormDescription>List any allergies or dietary needs.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuisinePreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine Preferences</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Italian, Mexican, Thai" {...field} />
                  </FormControl>
                   <FormDescription>What kind of food do you enjoy?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfMeals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Meals</FormLabel>
                   <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of meals" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} meal{i > 0 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>How many meals would you like in this plan?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !user}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generating...' : 'Generate Plan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
