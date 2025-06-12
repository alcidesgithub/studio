
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadStores, loadEvent, loadAwardTiers, loadVendors, loadDrawnWinners } from '@/lib/localStorageUtils';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import type { Store, Event, AwardTier, Vendor, SweepstakeWinnerRecord } from '@/types';
import { Users, BadgeCheck, Trophy, LayoutDashboard, Briefcase, Gift, Dice6 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  lojas: {
    label: "Lojas",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [drawnWinners, setDrawnWinners] = useState<SweepstakeWinnerRecord[]>([]);

  useEffect(() => {
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    // Ordenar faixas por requisito de PR para consistência no gráfico
    setAwardTiers(loadAwardTiers().sort((a, b) => (a.positivacoesRequired?.PR ?? 0) - (b.positivacoesRequired?.PR ?? 0)));
    setVendors(loadVendors());
    setDrawnWinners(loadDrawnWinners());
  }, []);

  const participatingStores = useMemo(() => stores.filter(s => s.participating), [stores]);
  const participatingStoresCount = useMemo(() => participatingStores.length, [participatingStores]);
  
  const totalPositivacoes = useMemo(() => 
    participatingStores.reduce((sum, s) => sum + (s.positivationsDetails?.filter(pd => vendors.some(v => v.id === pd.vendorId)).length || 0), 0), 
  [participatingStores, vendors]);

  const totalVendorsCount = useMemo(() => vendors.length, [vendors]);
  
  const totalPrizesAvailable = useMemo(() => 
    awardTiers.reduce((sum, tier) => sum + tier.quantityAvailable, 0), 
  [awardTiers]);
  
  const totalPrizesDrawn = useMemo(() => drawnWinners.length, [drawnWinners]);

  const storesByHighestTier = useMemo(() => {
    if (awardTiers.length === 0 && participatingStores.length === 0) return {};
    
    const tierCounts: Record<string, { name: string; count: number; reward: string }> = {};
    // Initialize all configured tiers with 0 counts
    awardTiers.forEach(tier => {
      tierCounts[tier.id] = { name: tier.name, count: 0, reward: tier.rewardName };
    });
    let storesWithNoTierCount = 0;

    participatingStores.forEach(store => {
      const positivacoesCount = store.positivationsDetails?.filter(pd => vendors.some(v => v.id === pd.vendorId)).length || 0;
      let highestAchievedTier: AwardTier | undefined = undefined;

      // Itera das faixas mais altas para as mais baixas (array já está ordenado por PR asc)
      for (let i = awardTiers.length - 1; i >= 0; i--) {
        const tier = awardTiers[i];
        if (!store.state) continue; // Skip if store has no state
        const required = getRequiredPositivationsForStore(tier, store.state);
        if (positivacoesCount >= required) {
          highestAchievedTier = tier;
          break;
        }
      }

      if (highestAchievedTier) {
        tierCounts[highestAchievedTier.id].count++;
      } else {
        storesWithNoTierCount++;
      }
    });

    if (storesWithNoTierCount > 0 && participatingStores.length > 0) {
      // Only add 'Nenhuma Faixa' if there are stores that didn't achieve any configured tier
      tierCounts['none'] = { name: 'Nenhuma Faixa', count: storesWithNoTierCount, reward: '-' };
    }
    return tierCounts;
  }, [participatingStores, awardTiers, vendors]);

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

  const noTiersConfigured = awardTiers.length === 0;
  const noParticipatingStores = participatingStoresCount === 0;
  const noStoresInAnyTier = chartData.every(d => d.lojas === 0);
  const showChart = !noTiersConfigured && !noParticipatingStores && !noStoresInAnyTier;


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Painel do Evento"
        description={`Visão geral do ${currentEvent.name}`}
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
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
            <BadgeCheck className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em lojas participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Participantes</CardTitle>
            <Briefcase className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendorsCount}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no evento</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prêmios (Faixas)</CardTitle>
            <Gift className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrizesAvailable}</div>
            <p className="text-xs text-muted-foreground">Disponíveis em todas as faixas</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêmios Já Sorteados</CardTitle>
            <Dice6 className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrizesDrawn}</div>
            <p className="text-xs text-muted-foreground">Distribuídos via sorteio</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Faixas de Premiação</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardDescription className="px-6 text-xs">
            Lojas pela maior faixa alcançada, baseado nos requisitos do seu estado (PR/SC).
          </CardDescription>
          <CardContent className="pt-4">
            {noTiersConfigured ? (
               <p className="text-sm text-muted-foreground text-center py-8">Nenhuma faixa de premiação configurada.</p>
            ) : noParticipatingStores ? (
               <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja participando para exibir distribuição.</p>
            ) : !showChart ? (
                 <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja atingiu as faixas de premiação ainda.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart 
                  accessibilityLayer 
                  data={chartData} 
                  margin={{ 
                    top: 5, 
                    right: 20, 
                    left: -5, 
                    bottom: chartData.length > 5 ? 50 : (chartData.length > 3 ? 35 : 20) 
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0} 
                    angle={chartData.length > 5 ? -45 : (chartData.length > 3 ? -30 : 0)}
                    textAnchor={chartData.length > 3 ? "end" : "middle"}
                    height={chartData.length > 5 ? 70 : (chartData.length > 3 ? 50 : 30)}
                    tickFormatter={(value: string) => value.length > 10 ? `${value.slice(0,8)}...` : value}
                  />
                  <YAxis allowDecimals={false} tickMargin={8} width={30} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="lojas" fill="var(--color-lojas)" radius={4} barSize={chartData.length > 6 ? 30 : undefined}/>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

