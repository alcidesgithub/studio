
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadStores, loadEvent, loadAwardTiers, loadVendors } from '@/lib/localStorageUtils';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import type { Store, Event, AwardTier, Vendor } from '@/types';
import { Store as StoreIcon, BadgeCheck, Trophy, LayoutDashboard, Briefcase, CheckSquare } from 'lucide-react';
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

  useEffect(() => {
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    setAwardTiers(loadAwardTiers().sort((a, b) => (a.positivacoesRequired?.PR ?? 0) - (b.positivacoesRequired?.PR ?? 0)));
    setVendors(loadVendors());
  }, []);

  const totalStoresCount = useMemo(() => stores.length, [stores]);
  const participatingStores = useMemo(() => stores.filter(s => s.participating), [stores]);
  
  const checkedInStoresCount = useMemo(() =>
    participatingStores.filter(s => s.isCheckedIn).length
  , [participatingStores]);

  const totalPositivacoes = useMemo(() => 
    participatingStores.reduce((sum, s) => sum + (s.positivationsDetails?.filter(pd => vendors.some(v => v.id === pd.vendorId)).length || 0), 0), 
  [participatingStores, vendors]);

  const totalVendorsCount = useMemo(() => vendors.length, [vendors]);
  
  const storesByHighestTier = useMemo(() => {
    if (awardTiers.length === 0 && participatingStores.length === 0) return {};
    
    const tierCounts: Record<string, { name: string; count: number; reward: string }> = {};
    awardTiers.forEach(tier => {
      tierCounts[tier.id] = { name: tier.name, count: 0, reward: tier.rewardName };
    });
    let storesWithNoTierCount = 0;

    participatingStores.forEach(store => {
      const positivacoesCount = store.positivationsDetails?.filter(pd => vendors.some(v => v.id === pd.vendorId)).length || 0;
      let highestAchievedTier: AwardTier | undefined = undefined;

      for (let i = awardTiers.length - 1; i >= 0; i--) {
        const tier = awardTiers[i];
        if (!store.state) continue; 
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
      }));
      
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

    const hasNenhumaFaixaData = storesByHighestTier['none']?.count > 0;
    const allOtherTiersAreZero = awardTiers.every(tier => (storesByHighestTier[tier.id]?.count || 0) === 0);

    let filteredData = data;
    if (hasNenhumaFaixaData && allOtherTiersAreZero) {
        filteredData = data.filter(d => d.name === 'Nenhuma Faixa' || d.lojas > 0);
    }
    
    return filteredData.sort((a, b) => {
        if (a.name === 'Nenhuma Faixa') return 1;
        if (b.name === 'Nenhuma Faixa') return -1;
        const tierAIndex = awardTiers.findIndex(t => t.name === a.name);
        const tierBIndex = awardTiers.findIndex(t => t.name === b.name);
        if (tierAIndex !== -1 && tierBIndex !== -1) {
            return tierAIndex - tierBIndex;
        }
        return b.lojas - a.lojas; 
    });

  }, [awardTiers, storesByHighestTier]);

  const maxLabelLength = useMemo(() => {
    return chartData.length > 0 ? Math.max(...chartData.map(d => d.name.length)) : 0;
  }, [chartData]);

  const yAxisWidthValue = useMemo(() => {
    const charWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 7;
    const padding = typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 30;
    return Math.max(60, Math.min(200, (maxLabelLength * charWidth) + padding));
  }, [maxLabelLength]);

  const barChartMarginLeft = useMemo(() => {
    return yAxisWidthValue; 
  }, [yAxisWidthValue]);


  if (!currentEvent) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Carregando painel...</p>
        </div>
    );
  }

  const noTiersConfigured = awardTiers.length === 0;
  const noParticipatingStores = participatingStores.length === 0;
  const noStoresInAnyTierBasedOnChartData = chartData.every(d => d.lojas === 0);
  const showChart = !noTiersConfigured && !noParticipatingStores && !noStoresInAnyTierBasedOnChartData;


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Painel do evento"
        description=""
        icon={LayoutDashboard}
        iconClassName="text-secondary" 
      />
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Cadastradas</CardTitle>
            <StoreIcon className="h-8 w-8 text-secondary" /> 
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStoresCount}</div>
            <p className="text-xs text-muted-foreground">Total de lojas no sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas com Check-in</CardTitle>
            <CheckSquare className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInStoresCount}</div>
            <p className="text-xs text-muted-foreground">Confirmaram presença</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos (Positivações)</CardTitle>
            <BadgeCheck className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em lojas participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Participantes</CardTitle>
            <Briefcase className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendorsCount}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no evento</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Faixas de Premiação</CardTitle>
            <Trophy className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardDescription className="px-4 sm:px-6 text-xs">
            Lojas pela maior faixa alcançada, baseado nos requisitos do seu estado (PR/SC).
          </CardDescription>
          <CardContent className="pt-4 px-2 sm:px-6">
            {noTiersConfigured ? (
               <p className="text-sm text-muted-foreground text-center py-8">Nenhuma faixa de premiação configurada.</p>
            ) : noParticipatingStores ? (
               <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja participando para exibir distribuição.</p>
            ) : !showChart ? (
                 <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja atingiu as faixas de premiação ainda.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <BarChart
                  layout="vertical"
                  accessibilityLayer 
                  data={chartData} 
                  margin={{ 
                    top: 5, 
                    right: 15, 
                    left: barChartMarginLeft - (typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 0),
                    bottom: 5
                  }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tickMargin={5} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={5}
                    interval={0}
                    width={yAxisWidthValue} 
                    className="text-xs"
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="lojas" fill="var(--color-lojas)" radius={4} barSize={chartData.length > 6 ? 18 : (chartData.length > 3 ? 22 : 25)}/>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
