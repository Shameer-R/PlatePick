'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MealPlanForm } from '@/components/meal-plan-form';
import { MealPlanDisplay } from '@/components/meal-plan-display';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Create and view your personalized AI-generated meal plans.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <MealPlanForm
            setIsLoading={setIsLoading}
            setMealPlan={setMealPlan}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-3">
          <MealPlanDisplay mealPlan={mealPlan} isLoading={isLoading} />
        </div>
      </div>
      
      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-headline tracking-tight">Past Meal Plans</h2>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/history">View All <ArrowRight className="ml-2" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
           <Card>
            <CardHeader>
              <CardTitle className="text-xl">Weekly Vegan Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">A 7-day vegan meal plan focusing on high-protein recipes. Generated on July 28, 2024.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Low-Carb Italian Dinners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">5 delicious low-carb Italian dinners, perfect for weeknights. Generated on July 25, 2024.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
