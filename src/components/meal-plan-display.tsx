import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, ExternalLink } from 'lucide-react';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Button } from './ui/button';

interface MealPlanDisplayProps {
  mealPlan: GenerateMealPlanOutput['mealPlan'] | null;
  isLoading: boolean;
}

export function MealPlanDisplay({ mealPlan, isLoading }: MealPlanDisplayProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your AI-Generated Plan</CardTitle>
        <CardDescription>
          {isLoading ? 'Our AI is crafting your personalized plan...' : 'Here is the meal plan created just for you.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <br/>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : mealPlan ? (
          <Accordion type="single" collapsible className="w-full">
            {mealPlan.map((meal, index) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed h-full min-h-[400px]">
            <Bot className="w-16 h-16 mb-4" />
            <p className="font-semibold">Your meal plan will appear here.</p>
            <p className="text-sm">Fill out the form to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
