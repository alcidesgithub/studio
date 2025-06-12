
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
      // and there are participating stores.
      if (Object.values(tierCounts).some(tc => tc.count > 0) || storesWithNoTierCount > 0) {
         tierCounts['none'] = { name: 'Nenhuma Faixa', count: storesWithNoTierCount, reward: '-' };
      }
    }
    return tierCounts;
  }, [participatingStores, awardTiers, vendors]);

  const chartData = useMemo(() => {
    const data = awardTiers
      .map(tier => ({
          name: tier.name,
          lojas: storesByHighestTier[tier.id]?.count || 0,
      }))
      .filter(d => d.lojas > 0); // Include only tiers with stores initially for sorting if needed or specific display
      
    // Re-add all tiers to ensure they are present, then add 'Nenhuma Faixa' if applicable
    const allTierNames = new Set(data.map(d => d.name));
    awardTiers.forEach(tier => {
        if (!allTierNames.has(tier.name)) {
            data.push({ name: tier.name, lojas: 0 });
            allTierNames.add(tier.name);
        }
    });


    if (storesByHighestTier['none']?.count > 0) {
        data.push({
            name: storesByHighestTier['none'].name,
            lojas: storesByHighestTier['none'].count,
        });
    }

    // Filter out entries that have 0 lojas IF 'Nenhuma Faixa' exists and has stores,
    // or if all other tiers have 0 lojas and 'Nenhuma Faixa' has stores.
    // This aims to prevent showing all tiers with 0 if 'Nenhuma Faixa' is the only one with data.
    const hasNenhumaFaixaData = storesByHighestTier['none']?.count > 0;
    const allOtherTiersAreZero = awardTiers.every(tier => (storesByHighestTier[tier.id]?.count || 0) === 0);

    if (hasNenhumaFaixaData && allOtherTiersAreZero) {
        return data.filter(d => d.name === 'Nenhuma Faixa' || d.lojas > 0);
    }
    
    // Sort so 'Nenhuma Faixa' appears last if present, otherwise by 'lojas' descending
    return data.sort((a, b) => {
        if (a.name === 'Nenhuma Faixa') return 1;
        if (b.name === 'Nenhuma Faixa') return -1;
        return b.lojas - a.lojas; // Example: sort by count, or keep original tier order
    });

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
  const noStoresInAnyTierBasedOnChartData = chartData.every(d => d.lojas === 0);
  // Refined showChart condition:
  // Show chart if there are tiers, participating stores, AND at least one category in chartData has 'lojas' > 0
  const showChart = !noTiersConfigured && !noParticipatingStores && !noStoresInAnyTierBasedOnChartData;


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
                  layout="vertical"
                  accessibilityLayer 
                  data={chartData} 
                  margin={{ 
                    top: 5, 
                    right: 30, 
                    left: (chartData.length > 5 ? 20 : 10) + (Math.max(...chartData.map(d => d.name.length)) > 10 ? 60 : 20), // Dynamic left margin
                    bottom: 20
                  }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tickMargin={8} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0}
                    width={Math.max(...chartData.map(d => d.name.length)) > 10 ? 100 : 80} // Dynamic width for Y-axis labels
                    tickFormatter={(value: string) => value.length > 12 ? `${value.slice(0,10)}...` : value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="lojas" fill="var(--color-lojas)" radius={4} barSize={chartData.length > 6 ? 20 : (chartData.length > 3 ? 25 : 30)}/>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

