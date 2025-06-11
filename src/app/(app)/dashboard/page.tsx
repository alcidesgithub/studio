
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadStores, loadEvent, loadAwardTiers } from '@/lib/localStorageUtils';
import type { Store, Event, AwardTier } from '@/types';
import { Users, ThumbsUp, Trophy, Building, LayoutDashboard } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);

  useEffect(() => {
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    // Load tiers and sort them by requirement ascending, crucial for determining highest tier
    setAwardTiers(loadAwardTiers().sort((a, b) => a.positivacoesRequired - b.positivacoesRequired));
  }, []);

  const participatingStoresCount = useMemo(() => stores.filter(s => s.participating).length, [stores]);
  const totalPositivacoes = useMemo(() => stores.reduce((sum, s) => sum + (s.positivationsDetails?.length || 0), 0), [stores]);

  const storesByHighestTier = useMemo(() => {
    if (awardTiers.length === 0) return {};

    const tierCounts: Record<string, { name: string; count: number; reward: string }> = {};
    awardTiers.forEach(tier => {
      tierCounts[tier.id] = { name: tier.name, count: 0, reward: tier.rewardName };
    });
    let storesWithNoTierCount = 0;

    stores.filter(s => s.participating).forEach(store => {
      const positivacoesCount = store.positivationsDetails?.length || 0;
      let highestAchievedTier: AwardTier | undefined = undefined;
      // Iterate tiers from highest requirement to lowest to find the max tier achieved
      for (let i = awardTiers.length - 1; i >= 0; i--) {
        if (positivacoesCount >= awardTiers[i].positivacoesRequired) {
          highestAchievedTier = awardTiers[i];
          break;
        }
      }

      if (highestAchievedTier) {
        tierCounts[highestAchievedTier.id].count++;
      } else {
        storesWithNoTierCount++;
      }
    });
    if(storesWithNoTierCount > 0 && stores.filter(s => s.participating).length > 0) {
        tierCounts['none'] = { name: 'Nenhuma Faixa', count: storesWithNoTierCount, reward: '-' };
    }


    return tierCounts;
  }, [stores, awardTiers]);


  if (!currentEvent) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Carregando painel...</p>
        </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Painel do Evento"
        description={`Visão geral do ${currentEvent.name}`}
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Participantes</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participatingStoresCount}</div>
            <p className="text-xs text-muted-foreground">de {stores.length} lojas cadastradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos (Positivações)</CardTitle>
            <ThumbsUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em todas as lojas participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Faixas</CardTitle>
            <Trophy className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {awardTiers.length > 0 ? (
                awardTiers.map(tier => (
                <div key={tier.id} className="text-xs flex justify-between">
                    <span>{tier.name}:</span>
                    <span className="font-semibold">{storesByHighestTier[tier.id]?.count || 0} lojas</span>
                </div>
                ))
            ) : (
                <p className="text-xs text-muted-foreground">Nenhuma faixa de premiação configurada.</p>
            )}
             {storesByHighestTier['none'] && storesByHighestTier['none'].count > 0 && (
                <div className="text-xs flex justify-between text-muted-foreground">
                    <span>{storesByHighestTier['none'].name}:</span>
                    <span className="font-semibold">{storesByHighestTier['none'].count} lojas</span>
                </div>
            )}
            {Object.keys(storesByHighestTier).length === 0 && awardTiers.length > 0 && (
                 <p className="text-xs text-muted-foreground">Nenhuma loja atingiu as faixas.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
