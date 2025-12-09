import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

interface MealPlanDisplayProps {
  mealPlan: string | null;
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
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <br/>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : mealPlan ? (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {mealPlan}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed h-full">
            <Bot className="w-16 h-16 mb-4" />
            <p className="font-semibold">Your meal plan will appear here.</p>
            <p className="text-sm">Fill out the form to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
