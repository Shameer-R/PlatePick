'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, auth } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [diet, setDiet] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPageLoading(false);
      return;
    }

    setName(user.displayName || '');
    setEmail(user.email || '');

    const fetchPreferences = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDiet(data.preferences?.dietaryRestrictions || '');
        setCuisine(data.preferences?.cuisinePreferences || '');
      }
      setPageLoading(false);
    };

    fetchPreferences();
  }, [user, authLoading]);

  const handleInfoSave = async () => {
    if (!user) return;
    setSavingInfo(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { name });
      toast({ title: 'Success', description: 'Personal information updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePrefsSave = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        preferences: {
          dietaryRestrictions: diet,
          cuisinePreferences: cuisine,
        },
      }, { merge: true });
      toast({ title: 'Success', description: 'Meal preferences saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSavingPrefs(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account and meal preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || ''} data-ai-hint="person face" />
              <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Button variant="outline" disabled>Change Photo</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
          </div>
          <Button onClick={handleInfoSave} disabled={savingInfo}>
            {savingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Meal Preferences</CardTitle>
          <CardDescription>These will be used as defaults for new meal plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diet">Default Dietary Restrictions</Label>
            <Textarea id="diet" placeholder="e.g., Vegetarian, Gluten-Free" value={diet} onChange={(e) => setDiet(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuisine">Default Cuisine Preferences</Label>
            <Input id="cuisine" placeholder="e.g., Italian, Mexican" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          </div>
          <Button onClick={handlePrefsSave} disabled={savingPrefs}>
            {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
