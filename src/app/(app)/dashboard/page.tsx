
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadStores, loadEvent, loadAwardTiers, loadVendors } from '@/lib/localStorageUtils';
import { getRequiredPositivationsForStore, formatDisplayCNPJ } from '@/lib/utils';
import type { Store, Event, AwardTier, Vendor } from '@/types';
import { Store as StoreIcon, Trophy, LayoutDashboard, Briefcase, CheckSquare, Users, Percent, Activity, BadgeCheck } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ALL_BRAZILIAN_STATES } from '@/lib/constants';

const tierChartConfig = {
  lojas: {
    label: "Lojas",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

const vendorPositivationsChartConfig = {
  positivations: {
    label: "Positivações",
    color: "hsl(var(--primary))",
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
    setAwardTiers(loadAwardTiers().sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)));
    setVendors(loadVendors());
  }, []);

  const totalStoresCount = useMemo(() => stores.length, [stores]);
  const participatingStores = useMemo(() => stores.filter(s => s.participating), [stores]);
  
  const checkedInStores = useMemo(() =>
    participatingStores.filter(s => s.isCheckedIn)
  , [participatingStores]);
  const checkedInStoresCount = checkedInStores.length;


  const checkedInPercentage = useMemo(() => {
    if (totalStoresCount === 0) return 0;
    return parseFloat(((checkedInStoresCount / totalStoresCount) * 100).toFixed(1));
  }, [checkedInStoresCount, totalStoresCount]);

  const totalPositivacoes = useMemo(() => 
    checkedInStores.reduce((sum, s) => sum + (s.positivationsDetails?.filter(pd => vendors.some(v => v.id === pd.vendorId)).length || 0), 0), 
  [checkedInStores, vendors]);

  const totalVendorsCount = useMemo(() => vendors.length, [vendors]);

  const averagePositivationsPerCheckedInStore = useMemo(() => {
    if (checkedInStoresCount === 0 || totalPositivacoes === 0) return 0;
    return parseFloat((totalPositivacoes / checkedInStoresCount).toFixed(1));
  }, [totalPositivacoes, checkedInStoresCount]);
  
  const storesByHighestTier = useMemo(() => {
    const activeStoresForTiers = participatingStores.filter(s => s.isCheckedIn);
    if (awardTiers.length === 0 && activeStoresForTiers.length === 0) return {};
    
    const tierCounts: Record<string, { name: string; count: number; reward: string }> = {};
    awardTiers.forEach(tier => {
      tierCounts[tier.id] = { name: tier.name, count: 0, reward: tier.rewardName };
    });
    let storesWithNoTierCount = 0;

    activeStoresForTiers.forEach(store => {
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

    if (storesWithNoTierCount > 0 && activeStoresForTiers.length > 0) {
       if (Object.values(tierCounts).some(tc => tc.count > 0) || storesWithNoTierCount > 0) {
         tierCounts['none'] = { name: 'Nenhuma Faixa', count: storesWithNoTierCount, reward: '-' };
       }
    }
    return tierCounts;
  }, [participatingStores, awardTiers, vendors]);

  const tierDistributionChartData = useMemo(() => {
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
    if (hasNenhumaFaixaData && allOtherTiersAreZero && data.length > 1) { // Ensure 'Nenhuma Faixa' is not the only entry
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
  
  const positivationsByVendorChartData = useMemo(() => {
    const activeStoresForVendorChart = participatingStores.filter(s => s.isCheckedIn);
    if (activeStoresForVendorChart.length === 0 || vendors.length === 0) return [];
    
    const counts: Record<string, number> = {};
    activeStoresForVendorChart.forEach(store => {
      store.positivationsDetails?.forEach(pd => {
        if (vendors.some(v => v.id === pd.vendorId)) { // Ensure vendor still exists
          counts[pd.vendorId] = (counts[pd.vendorId] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([vendorId, count]) => {
        const vendor = vendors.find(v => v.id === vendorId);
        return {
          name: vendor ? vendor.name : `ID ${vendorId.substring(0,8)}...`,
          positivations: count,
        };
      })
      .sort((a, b) => b.positivations - a.positivations)
      .slice(0, 10); // Display top 10
  }, [participatingStores, vendors]);


  const calculateYAxisWidth = (data: {name: string}[]) => {
    const maxLabelLength = data.length > 0 ? Math.max(...data.map(d => d.name.length)) : 0;
    const charWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 7;
    const padding = typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 30;
    return Math.max(60, Math.min(200, (maxLabelLength * charWidth) + padding));
  };

  const tierChartYAxisWidth = useMemo(() => calculateYAxisWidth(tierDistributionChartData), [tierDistributionChartData]);
  const vendorChartYAxisWidth = useMemo(() => calculateYAxisWidth(positivationsByVendorChartData), [positivationsByVendorChartData]);
  

  if (!currentEvent) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Carregando painel...</p>
        </div>
    );
  }

  const activeParticipatingStores = participatingStores.filter(s => s.isCheckedIn);
  const noTiersConfigured = awardTiers.length === 0;
  const noActiveParticipatingStores = activeParticipatingStores.length === 0;
  const noStoresInAnyTierBasedOnChartData = tierDistributionChartData.every(d => d.lojas === 0) && !(tierDistributionChartData.length === 1 && tierDistributionChartData[0].name === "Nenhuma Faixa");
  const showTierChart = !noTiersConfigured && !noActiveParticipatingStores && !noStoresInAnyTierBasedOnChartData;


  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8">
      <PageHeader
        title="Painel do Evento"
        description={`Visão geral e métricas chave para ${currentEvent.name}.`}
        icon={LayoutDashboard}
        iconClassName="text-secondary" 
      />
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Cadastradas</CardTitle>
            <StoreIcon className="h-8 w-8 text-secondary" /> 
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStoresCount}</div>
            <p className="text-xs text-muted-foreground">Cadastradas no evento</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas com Check-in</CardTitle>
            <CheckSquare className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInStoresCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de lojas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentual de Check-in</CardTitle>
            <Activity className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInPercentage}%</div>
            <p className="text-xs text-muted-foreground">Das lojas cadastradas confirmaram presença</p>
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

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos (Lojas com Check-in)</CardTitle>
            <BadgeCheck className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em lojas participantes com check-in no evento</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Selos / Loja Presente</CardTitle>
            <Percent className="h-8 w-8 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePositivationsPerCheckedInStore}</div>
            <p className="text-xs text-muted-foreground">Selos por loja presente</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Distribuição por Faixas (Lojas com Check-in)</CardTitle>
              <Trophy className="h-8 w-8 text-secondary" />
            </CardHeader>
            <CardDescription className="px-4 sm:px-6 text-xs">
              Lojas com check-in pela maior faixa alcançada, baseado nos requisitos do seu estado (PR/SC).
            </CardDescription>
            <CardContent className="pt-4 px-2 sm:px-6">
              {!showTierChart ? (
                  noTiersConfigured ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma faixa de premiação configurada.</p>
                  : noActiveParticipatingStores ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja com check-in para exibir distribuição.</p>
                  : <p className="text-sm text-muted-foreground text-center py-8">Nenhuma loja com check-in atingiu as faixas de premiação ainda.</p>
              ) : (
                <ChartContainer config={tierChartConfig} className="h-[250px] sm:h-[300px] w-full">
                  <BarChart
                    layout="vertical"
                    accessibilityLayer 
                    data={tierDistributionChartData} 
                    margin={{ 
                      top: 5, 
                      right: 15, 
                      left: tierChartYAxisWidth - (typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 0),
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
                      width={tierChartYAxisWidth} 
                      className="text-xs"
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="lojas" fill="var(--color-lojas)" radius={4} barSize={tierDistributionChartData.length > 6 ? 18 : (tierDistributionChartData.length > 3 ? 22 : 25)}/>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">Top Fornecedores (Positivações em Lojas com Check-in)</CardTitle>
                   <CardDescription className="text-xs mt-1">Fornecedores que mais concederam selos a lojas participantes com check-in.</CardDescription>
                </div>
                <Briefcase className="h-8 w-8 text-secondary" />
              </CardHeader>
              <CardContent>
                  {positivationsByVendorChartData.length > 0 ? (
                      <ChartContainer config={vendorPositivationsChartConfig} className="h-[250px] sm:h-[300px] w-full">
                          <BarChart layout="vertical" data={positivationsByVendorChartData} margin={{ top: 5, right: 15, left: vendorChartYAxisWidth - (typeof window !== 'undefined' && window.innerWidth < 640 ? 15 : 5) , bottom: 5 }}>
                              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                              <XAxis type="number" allowDecimals={false} />
                              <YAxis type="category" dataKey="name" width={vendorChartYAxisWidth} tickLine={false} axisLine={false} className="text-xs" interval={0} />
                              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                              <Bar dataKey="positivations" fill="var(--color-positivations)" radius={4} barSize={positivationsByVendorChartData.length > 6 ? 18 : (positivationsByVendorChartData.length > 3 ? 22 : 25)} />
                          </BarChart>
                      </ChartContainer>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma positivação em lojas com check-in registrada para exibir o ranking.</p>
                  )}
              </CardContent>
          </Card>
        </div>
    </div>
  );
}

