import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Meal Plan History</h1>
        <p className="text-muted-foreground">Browse your previously generated meal plans.</p>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Weekly Vegan Plan</CardTitle>
            <CardDescription>A 7-day vegan meal plan focusing on high-protein recipes. Generated on July 28, 2024.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Monday: Tofu Scramble for breakfast, Lentil Soup for lunch, and Chickpea Curry for dinner. 
              <br />
              Tuesday: ...
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Low-Carb Italian Dinners</CardTitle>
            <CardDescription>5 delicious low-carb Italian dinners, perfect for weeknights. Generated on July 25, 2024.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Meal 1: Zucchini Lasagna. 
              <br />
              Meal 2: Chicken Parmesan with Almond Flour.
              <br />
              ...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
