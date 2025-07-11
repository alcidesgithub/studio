
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { loadStores, loadAwardTiers, loadEvent, loadVendors, loadDrawnWinners } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, AwardTier, PositivationDetail, Vendor, Event as EventType, SweepstakeWinnerRecord } from '@/types';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import { Trophy, TrendingUp, Gift, BadgeCheck, Building, Eye, PartyPopper } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { VendorPositivationDisplayCard } from '@/components/cards/VendorPositivationDisplayCard';
import Link from 'next/link';

export default function StorePositivacaoPage() {
  const { user } = useAuth();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [drawnWinners, setDrawnWinners] = useState<SweepstakeWinnerRecord[]>([]);

  useEffect(() => {
    setAllStores(loadStores());
    const loadedTiers = loadAwardTiers();
    setAwardTiers(loadedTiers);
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
    setDrawnWinners(loadDrawnWinners());
  }, []);

  const currentStore = useMemo(() => {
    if (!user || !user.email) return undefined;
    return allStores.find(s => s.email === user.email);
  }, [user, allStores]);

  const winnerInfo = useMemo(() => {
    if (!currentStore) return undefined;
    return drawnWinners.find(winner => winner.storeId === currentStore.id);
  }, [drawnWinners, currentStore]);

  // Positivations for the currently viewed store (matrix itself, or the logged-in branch/standalone)
  const positivationsDetailsForCurrentStoreView = useMemo(() => {
    if (!currentStore || !currentStore.positivationsDetails || allVendors.length === 0) return [];
    const existingVendorIds = new Set(allVendors.map(v => v.id));
    return currentStore.positivationsDetails.filter(pd => existingVendorIds.has(pd.vendorId));
  }, [currentStore, allVendors]);

  const positivacoesCountForCurrentStoreView = useMemo(() => positivationsDetailsForCurrentStoreView.length, [positivationsDetailsForCurrentStoreView]);

  const sortedAwardTiersForDisplay = useMemo(() => {
    return [...awardTiers].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
  }, [awardTiers]);

  const currentAchievedTierForCurrentStoreView = useMemo(() => {
    if (!currentStore || sortedAwardTiersForDisplay.length === 0 || !currentStore.state) return undefined;
    const storeStateForRequirements = currentStore.state;
    let achievedTier: AwardTier | undefined = undefined;
    for (let i = sortedAwardTiersForDisplay.length - 1; i >= 0; i--) {
        const tier = sortedAwardTiersForDisplay[i];
        if (positivacoesCountForCurrentStoreView >= getRequiredPositivationsForStore(tier, storeStateForRequirements)) {
            achievedTier = tier;
            break;
        }
    }
    return achievedTier;
  }, [sortedAwardTiersForDisplay, positivacoesCountForCurrentStoreView, currentStore]);

  const nextTierForCurrentStoreView = useMemo(() => {
    if (!currentStore || sortedAwardTiersForDisplay.length === 0 || !currentStore.state) return undefined;
    if (currentAchievedTierForCurrentStoreView) {
        const currentTierIndex = sortedAwardTiersForDisplay.findIndex(t => t.id === currentAchievedTierForCurrentStoreView!.id);
        if (currentTierIndex < sortedAwardTiersForDisplay.length - 1) {
            return sortedAwardTiersForDisplay[currentTierIndex + 1];
        }
        return undefined;
    }
    return sortedAwardTiersForDisplay.length > 0 ? sortedAwardTiersForDisplay[0] : undefined;
  }, [sortedAwardTiersForDisplay, currentAchievedTierForCurrentStoreView, currentStore]);

  const progressToNextTierForCurrentStoreView = useMemo(() => {
    if (!currentStore || !nextTierForCurrentStoreView || !currentStore.state) return currentAchievedTierForCurrentStoreView ? 100 : 0;
    const storeStateForRequirements = currentStore.state;
    const requiredForNext = getRequiredPositivationsForStore(nextTierForCurrentStoreView, storeStateForRequirements);
    if (requiredForNext === 0) return positivacoesCountForCurrentStoreView >= 0 ? 100 : 0;
    if (requiredForNext <= 0 || positivacoesCountForCurrentStoreView < 0) return 0;
    const progress = (positivacoesCountForCurrentStoreView / requiredForNext) * 100;
    return Math.min(progress, 100);
  }, [nextTierForCurrentStoreView, positivacoesCountForCurrentStoreView, currentAchievedTierForCurrentStoreView, currentStore]);

  const positivationsMapForCartela = useMemo(() => {
    const map = new Map<string, PositivationDetail>();
    // Cartela always shows the direct positivations of the currentStore (matrix or branch)
    const detailsForCartela = currentStore?.positivationsDetails?.filter(pd => allVendors.some(v => v.id === pd.vendorId)) || [];
    detailsForCartela.forEach(detail => {
      map.set(detail.vendorId, detail);
    });
    return map;
  }, [currentStore, allVendors]);

  const branchesOfCurrentStore = useMemo(() => {
    if (!currentStore || !currentStore.isMatrix) return [];
    return allStores.filter(store => store.matrixStoreId === currentStore.id);
  }, [currentStore, allStores]);


  if (!user || !currentEvent) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Minhas Positivações" icon={BadgeCheck} iconClassName="text-secondary" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Carregando dados...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentStore) {
     return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Minhas Positivações" icon={BadgeCheck} iconClassName="text-secondary" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Dados da loja não encontrados para o usuário {user.name}. Verifique se o email da loja está correto no cadastro de usuários.
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = `${currentStore.code} - ${currentStore.name} (${currentStore.state || 'N/A'})${currentStore.isMatrix ? " (Matriz)" : ""}`;
  const pageDescription = `Sua performance e selos recebidos no ${currentEvent.name}${currentStore.isMatrix ? ". Detalhes das filiais abaixo." : ""}`;


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={BadgeCheck}
        iconClassName="text-secondary"
      />

      {winnerInfo && (
        <Card className="mb-6 sm:mb-8 border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-300">
              <PartyPopper className="h-8 w-8" />
              Parabéns, você foi premiado!
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Sua loja foi sorteada e ganhou o seguinte prêmio:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">{winnerInfo.prizeName}</p>
            <p className="text-sm text-muted-foreground">Da faixa de premiação: {winnerInfo.tierName}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos Recebidos {currentStore.isMatrix && <span className="text-xs font-normal">(Apenas Matriz)</span>}</CardTitle>
            <BadgeCheck className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{positivacoesCountForCurrentStoreView}</div>
            <p className="text-xs text-muted-foreground">De fornecedores participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa de Premiação Atual {currentStore.isMatrix && <span className="text-xs font-normal">(Apenas Matriz)</span>}</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {currentAchievedTierForCurrentStoreView ? currentAchievedTierForCurrentStoreView.name : 'Nenhuma'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAchievedTierForCurrentStoreView ? `Prêmio: ${currentAchievedTierForCurrentStoreView.rewardName}` : 'Continue coletando selos!'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Próxima Faixa {currentStore.isMatrix && <span className="text-xs font-normal">(Apenas Matriz)</span>}</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {nextTierForCurrentStoreView && currentStore.state ? (
              <>
                <div className="text-lg sm:text-xl font-bold">{positivacoesCountForCurrentStoreView} / {getRequiredPositivationsForStore(nextTierForCurrentStoreView, currentStore.state)} selos</div>
                <Progress value={progressToNextTierForCurrentStoreView} className="mt-2 h-2.5 sm:h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam {Math.max(0, getRequiredPositivationsForStore(nextTierForCurrentStoreView, currentStore.state) - positivacoesCountForCurrentStoreView)} selos para a faixa {nextTierForCurrentStoreView.name}!
                </p>
              </>
            ) : (
              currentAchievedTierForCurrentStoreView ? (
                  <>
                  <div className="text-lg sm:text-xl font-bold">Parabéns!</div>
                  <p className="text-xs text-muted-foreground mt-1">Você atingiu a faixa máxima de premiação!</p>
                  </>
              ) : (
                  <>
                  <div className="text-lg sm:text-xl font-bold">
                    {positivacoesCountForCurrentStoreView} / {awardTiers.length > 0 && currentStore.state && sortedAwardTiersForDisplay.length > 0 && sortedAwardTiersForDisplay[0] ? getRequiredPositivationsForStore(sortedAwardTiersForDisplay[0], currentStore.state) : (awardTiers.length > 0 && sortedAwardTiersForDisplay.length > 0 && sortedAwardTiersForDisplay[0] ? (sortedAwardTiersForDisplay[0].positivacoesRequired.PR || '0') : '-')} selos
                  </div>
                    <Progress value={progressToNextTierForCurrentStoreView} className="mt-2 h-2.5 sm:h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {awardTiers.length === 0 ? "Nenhuma faixa de premiação configurada." : (currentStore.state ? "Comece a coletar selos!" : "Dados do estado da loja incompletos.")}
                  </p>
                  </>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl mb-6 sm:mb-8 bg-[#2d2d2d]">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl sm:text-4xl md:text-5xl text-[#c3f45d]">
            Cartela de positivação
          </CardTitle>
          {currentStore.isMatrix && (
            <p className="text-xl font-normal text-[#c3f45d]">
              (Apenas Matriz)
            </p>
          )}
          <CardDescription className="text-white">
            Veja quais fornecedores já te positivaram (para esta loja) e por qual vendedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allVendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado para o evento.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {allVendors.map((vendor: Vendor) => (
                <VendorPositivationDisplayCard
                  key={vendor.id}
                  vendor={vendor}
                  positivation={positivationsMapForCartela.get(vendor.id)}
                />
              ))}
            </div>
          )}
          {positivationsDetailsForCurrentStoreView.length === 0 && allVendors.length > 0 && (
            <p className="mt-6 sm:mt-8 text-center text-base sm:text-lg text-white/50">
              Ainda não há selos (positivações) para esta loja. Positive com os fornecedores para recebê-los!
            </p>
          )}
        </CardContent>
      </Card>

      {currentStore.isMatrix && branchesOfCurrentStore.length > 0 && (
        <Card className="shadow-lg mb-6 sm:mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <Building className="h-5 w-5 sm:h-6 sm:w-6 text-secondary"/>
            <CardTitle>Desempenho das Filiais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 sm:px-4">Código</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Nome da Filial</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Selos</TableHead>
                    <TableHead className="text-center px-2 py-3 sm:px-4">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchesOfCurrentStore.map((branch) => {
                    const branchPositivationsCount = branch.positivationsDetails?.filter(pd => allVendors.some(v => v.id === pd.vendorId)).length || 0;
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="px-2 py-3 sm:px-4">{branch.code}</TableCell>
                        <TableCell className="font-medium px-2 py-3 sm:px-4">{branch.name}</TableCell>
                        <TableCell className="text-right font-semibold px-2 py-3 sm:px-4">{branchPositivationsCount}</TableCell>
                        <TableCell className="text-center px-2 py-3 sm:px-4">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/store/branch/${branch.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg mb-6 sm:mb-8">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-secondary"/>
          <CardTitle>Faixas de Premiação Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAwardTiersForDisplay.length > 0 && currentStore.state ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 sm:px-4">Nome da Faixa</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Prêmio</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Qtd. Total Prêmios</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Selos Necessários ({currentStore.state})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAwardTiersForDisplay.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium px-2 py-3 sm:px-4">{tier.name}</TableCell>
                      <TableCell className="px-2 py-3 sm:px-4 break-words">{tier.rewardName}</TableCell>
                      <TableCell className="text-right px-2 py-3 sm:px-4">{tier.quantityAvailable}</TableCell>
                      <TableCell className="text-right font-semibold px-2 py-3 sm:px-4">{getRequiredPositivationsForStore(tier, currentStore.state!)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma faixa de premiação configurada para o evento ou estado da loja não definido.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 sm:mt-8 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-2">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-secondary"/>
              <CardTitle>Qualificação para Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="text-sm">Sua loja (apenas <span className="font-semibold">{currentStore.name}</span>) tem <span className="font-bold text-base sm:text-lg text-secondary">{positivacoesCountForCurrentStoreView}</span> selos.</p>
          <p className="text-xs text-muted-foreground mt-1">Lojas com mais selos e que atingem as faixas de premiação participam de sorteios especiais. Continue positivando!</p>
          </CardContent>
      </Card>
    </div>
  );
}

    
