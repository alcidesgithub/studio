
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// import { MOCK_STORES, MOCK_EVENT } from '@/lib/constants'; // No longer use mocks directly
import { loadStores, loadEvent, loadAwardTiers } from '@/lib/localStorageUtils';
import type { Store, Event, AwardTier } from '@/types';
import { Users, ThumbsUp, Target, Building, LayoutDashboard } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);

  useEffect(() => {
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    setAwardTiers(loadAwardTiers().sort((a,b) => a.positivacoesRequired - b.positivacoesRequired));
  }, []);

  const participatingStoresCount = useMemo(() => stores.filter(s => s.participating).length, [stores]);
  const totalPositivacoes = useMemo(() => stores.reduce((sum, s) => sum + (s.positivationsDetails?.length || 0), 0), [stores]);
  
  const averageGoalProgress = useMemo(() => {
    if (stores.length === 0) return 0;
    const totalProgress = stores.reduce((sum, s) => sum + s.goalProgress, 0);
    return totalProgress / stores.length;
  }, [stores]);

  const storesWithTiers = useMemo(() => {
    return stores.map(store => {
      let achievedTier: AwardTier | undefined = undefined;
      const positivacoesCount = store.positivationsDetails?.length || 0;
      // Iterate from highest tier to lowest to find the current one
      for (let i = awardTiers.length - 1; i >= 0; i--) {
        if (positivacoesCount >= awardTiers[i].positivacoesRequired) {
          achievedTier = awardTiers[i];
          break; 
        }
      }
      return {...store, currentTier: achievedTier };
    }).slice(0,3); // Take first 3 for quick view
  }, [stores, awardTiers]);


  if (!currentEvent) {
    return <div>Carregando painel...</div>; // Or a proper loader
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
            <p className="text-xs text-muted-foreground">de {stores.length} lojas no total</p>
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
            <CardTitle className="text-sm font-medium">Progresso Médio das Lojas</CardTitle>
            <Target className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGoalProgress.toFixed(0)}%</div>
            <Progress value={averageGoalProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 font-headline">Visão Rápida das Lojas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {storesWithTiers.map(store => (
            <Card key={store.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary"/>
                  {store.name} ({store.code})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Selos: <span className="font-semibold">{store.positivationsDetails?.length || 0}</span></p>
                <div className="flex items-center gap-2">
                  <p className="text-sm">Progresso: </p><Progress value={store.goalProgress} className="flex-1 h-2" /> <span className="text-sm font-semibold">{store.goalProgress}%</span>
                </div>
                {store.currentTier && <p className="text-sm">Faixa Atual: <span className="font-semibold text-accent">{store.currentTier.name}</span></p>}
                 <p className="text-xs text-muted-foreground">{store.participating ? "Participando" : "Não participando"}</p>
              </CardContent>
            </Card>
          ))}
           {stores.length === 0 && <p className="text-muted-foreground text-center col-span-full">Nenhuma loja cadastrada.</p>}
        </div>
      </div>
    </div>
  );
}
