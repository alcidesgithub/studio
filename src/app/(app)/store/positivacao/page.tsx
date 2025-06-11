// src/app/(app)/store/positivacao/page.tsx
"use client"; // For potential client-side data fetching or interactions

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MOCK_STORES, MOCK_AWARD_TIERS, MOCK_EVENT } from '@/lib/constants'; // Assuming current store is user.storeName
import { Star, Award, TrendingUp, ThumbsUp, Medal, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
// import type { Metadata } from 'next'; // Client component, metadata not typical here

// export const metadata: Metadata = {
//   title: 'My Scorecard - Hiperfarma Business Meeting Manager',
// };

export default function StorePositivacaoPage() {
  const { user } = useAuth();
  
  // Find the current store's data based on the logged-in user
  // This is a mock; in a real app, this would come from a specific API endpoint for the store
  const currentStore = MOCK_STORES.find(s => s.name === user?.storeName) || MOCK_STORES[0]; // Fallback to first store for demo

  if (!currentStore) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="My Scorecard" icon={Star} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Store data not found. Please contact support.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine next tier
  const currentTierIndex = MOCK_AWARD_TIERS.findIndex(tier => tier.id === currentStore.currentTier?.id);
  const nextTier = currentTierIndex !== -1 && currentTierIndex < MOCK_AWARD_TIERS.length - 1 
    ? MOCK_AWARD_TIERS[currentTierIndex + 1] 
    : null;
  
  // Mock success rate (e.g., based on goal progress)
  const successRate = currentStore.goalProgress;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`${currentStore.name} - Scorecard`}
        description={`Your performance overview for ${MOCK_EVENT.name}`}
        icon={Star}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positivações Received</CardTitle>
            <ThumbsUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStore.positivacoes}</div>
            <p className="text-xs text-muted-foreground">From participating vendors</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Award Tier</CardTitle>
            <Medal className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStore.currentTier ? currentStore.currentTier.name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStore.currentTier ? `Reward: ${currentStore.currentTier.reward}` : 'No tier achieved yet.'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStore.goalProgress}%</div>
            <Progress value={currentStore.goalProgress} className="mt-2 h-2" />
             <p className="text-xs text-muted-foreground">
              {nextTier ? `Towards ${nextTier.name} Tier` : 'Max tier or event goal reached!'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList /> Tier Qualification Overview</CardTitle>
          <CardDescription>See your progress towards available award tiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_AWARD_TIERS.map(tier => {
            // Mocking if tier is achieved
            const isAchieved = currentStore.currentTier && MOCK_AWARD_TIERS.findIndex(t => t.id === currentStore.currentTier!.id) >= MOCK_AWARD_TIERS.findIndex(t => t.id === tier.id);
            // This logic would be more complex in a real app
            // e.g. checking specific positivacao counts against tier.qualificationCriteria
            
            return (
              <div key={tier.id} className={`p-4 rounded-md border ${isAchieved ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-primary">{tier.name}</h3>
                  {isAchieved && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Achieved</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Criteria: {tier.qualificationCriteria}</p>
                <p className="text-sm text-muted-foreground">Reward: <span className="font-medium">{tier.reward}</span></p>
                {!isAchieved && (
                  <div className="mt-2">
                    {/* Placeholder progress for unachieved tiers */}
                    <p className="text-xs text-muted-foreground mb-1">Your Progress:</p>
                    <Progress value={Math.min(currentStore.positivacoes / (parseInt(tier.qualificationCriteria) || 10) * 100, 100)} className="h-2"/>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>Success Rate & Sweepstakes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Your current estimated success rate is <span className="font-bold text-lg text-accent">{successRate}%</span>.</p>
          <p className="text-xs text-muted-foreground mt-1">Stores with high success rates may qualify for special sweepstakes. Keep up the great work!</p>
        </CardContent>
      </Card>
    </div>
  );
}
