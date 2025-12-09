'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth.tsx';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import type { MealPlanRequest } from '@/lib/definitions';


interface MealPlanDocument {
  id: string;
  createdAt: Timestamp;
  meals: GenerateMealPlanOutput['mealPlan'];
  preferencesSnapshot: MealPlanRequest;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlanDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMealPlans = async () => {
      try {
        const q = query(
          collection(db, 'meal_plans'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlanDocument));
        setMealPlans(plans);
      } catch (error) {
        console.error("Error fetching meal plans: ", error);
        // Handle error display to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealPlans();
  }, [user, authLoading]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Date not available';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleReusePlan = (preferences: MealPlanRequest) => {
    const params = new URLSearchParams({
        diet: preferences.dietaryRestrictions,
        cuisine: preferences.cuisinePreferences,
        meals: String(preferences.numberOfMeals)
    });
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Meal Plan History</h1>
        <p className="text-muted-foreground">Browse your previously generated meal plans.</p>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full mt-2" />
              </CardContent>
            </Card>
          ))
        ) : mealPlans.length > 0 ? (
          mealPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="text-xl capitalize">
                  {plan.preferencesSnapshot?.cuisinePreferences || 'Meal Plan'}
                </CardTitle>
                <CardDescription>
                  Generated on {formatDate(plan.createdAt)} &bull; {plan.meals.length} meals
                   &bull; <span className="capitalize">{plan.preferencesSnapshot?.dietaryRestrictions}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {plan.meals.map((meal, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-headline text-lg">{meal.name}</AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col sm:flex-row gap-6">
                            {meal.imageUrl && (
                              <div className="relative w-full sm:w-1/3 aspect-square rounded-md overflow-hidden">
                                <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" data-ai-hint="food meal" />
                              </div>
                            )}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Ingredients</h4>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                    </ul>
                                </div>
                                {meal.sourceUrl && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer">
                                            View Recipe Source <ExternalLink className="ml-2" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">Instructions</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meal.instructions}</p>
                          </div>
                          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                            {meal.calories && <span>Est. Calories: {meal.calories}</span>}
                            {meal.macros && <span>Macros: {meal.macros}</span>}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
              </CardContent>
               <CardFooter className="border-t pt-4">
                <Button variant="secondary" size="sm" onClick={() => handleReusePlan(plan.preferencesSnapshot)}>
                    <RefreshCw className="mr-2" />
                    Reuse Preferences
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven't generated any meal plans yet. Go to the dashboard to create your first one!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
