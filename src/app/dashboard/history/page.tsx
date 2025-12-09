'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MealPlan {
  id: string;
  createdAt: Timestamp;
  meals: string;
  preferencesSnapshot: {
    dietaryRestrictions: string;
    cuisinePreferences: string;
  };
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
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
        const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlan));
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Meal Plan History</h1>
        <p className="text-muted-foreground">Browse your previously generated meal plans.</p>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          </>
        ) : mealPlans.length > 0 ? (
          mealPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {plan.preferencesSnapshot?.cuisinePreferences || 'Meal Plan'}
                </CardTitle>
                <CardDescription>
                  Generated on {formatDate(plan.createdAt)}
                  <br />
                  <span className='capitalize'>
                  {plan.preferencesSnapshot?.dietaryRestrictions}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{plan.meals.substring(0, 200)}...</p>
              </CardContent>
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
