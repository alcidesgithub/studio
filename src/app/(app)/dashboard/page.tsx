
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadStores, loadEvent, loadAwardTiers } from '@/lib/localStorageUtils';
import type { Store, Event, AwardTier } from '@/types';
import { Users, ThumbsUp, Trophy, LayoutDashboard } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  lojas: {
    label: "Lojas",
    color: "hsl(var(--secondary))", // Changed from --primary to --secondary
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);

  useEffect(() => {
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    setAwardTiers(loadAwardTiers().sort((a, b) => a.positivacoesRequired - b.positivacoesRequired));
  }, []);

  const participatingStoresCount = useMemo(() => stores.filter(s => s.participating).length, [stores]);
  const totalPositivacoes = useMemo(() => stores.reduce((sum, s) => sum + (s.positivationsDetails?.length || 0), 0), [stores]);

  const storesByHighestTier = useMemo(() => {
    if (awardTiers.length === 0 && stores.filter(s => s.participating).length === 0) return {};
    
    const tierCounts: Record<string, { name: string; count: number; reward: string }> = {};
    awardTiers.forEach(tier => {
      tierCounts[tier.id] = { name: tier.name, count: 0, reward: tier.rewardName };
    });
    let storesWithNoTierCount = 0;

    stores.filter(s => s.participating).forEach(store => {
      const positivacoesCount = store.positivationsDetails?.length || 0;
      let highestAchievedTier: AwardTier | undefined = undefined;
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

    if (storesWithNoTierCount > 0 && stores.filter(s => s.participating).length > 0) {
      tierCounts['none'] = { name: 'Nenhuma Faixa', count: storesWithNoTierCount, reward: '-' };
    }
    return tierCounts;
  }, [stores, awardTiers]);

  const chartData = useMemo(() => {
    const data = awardTiers.map(tier => ({
        name: tier.name,
        lojas: storesByHighestTier[tier.id]?.count || 0,
    }));
    if (storesByHighestTier['none']?.count > 0) {
        data.push({
            name: storesByHighestTier['none'].name,
            lojas: storesByHighestTier['none'].count,
        });
    }
    return data;
  }, [awardTiers, storesByHighestTier]);


  if (!currentEvent) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Carregando painel...</p>
        </div>
    );
  }

  const showChart = awardTiers.length > 0 && (chartData.length > 0 && chartData.some(d => d.lojas > 0));
  const noTiersConfigured = awardTiers.length === 0;
  const noStoresInTiers = awardTiers.length > 0 && chartData.every(d => d.lojas === 0) && (!storesByHighestTier['none'] || storesByHighestTier['none'].count === 0);


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
            <Users className="h-5 w-5 text-secondary" /> 
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participatingStoresCount}</div>
            <p className="text-xs text-muted-foreground">de {stores.length} lojas cadastradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos (Positivações)</CardTitle>
            <ThumbsUp className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em todas as lojas participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Faixas</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent className="pt-4">
            {noTiersConfigured ? (
               <p className="text-sm text-muted-foreground text-center py-4">Nenhuma faixa de premiação configurada.</p>
            ) : noStoresInTiers && chartData.filter(d => d.lojas > 0).length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">Nenhuma loja atingiu as faixas ainda.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0} 
                    tickFormatter={(value) => value.length > 10 ? `${value.slice(0,8)}...` : value}
                  />
                  <YAxis allowDecimals={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="lojas" fill="var(--color-lojas)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

