
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { loadStores, loadAwardTiers, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, AwardTier, PositivationDetail, Vendor, Event as EventType } from '@/types';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import { Star, Trophy, TrendingUp, Gift, BadgeCheck } from 'lucide-react'; // Removed Award, Trophy is already here
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState, useMemo } from 'react';

export default function StorePositivacaoPage() {
  const { user } = useAuth();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setAllStores(loadStores());
    const loadedTiers = loadAwardTiers();
    setAwardTiers(loadedTiers);
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const currentStore = useMemo(() => {
    if (!user || !user.storeName) return undefined;
    return allStores.find(s => s.name === user.storeName);
  }, [user, allStores]);

  const validPositivationsDetails = useMemo(() => {
    if (!currentStore || !currentStore.positivationsDetails || allVendors.length === 0) return [];
    const existingVendorIds = new Set(allVendors.map(v => v.id));
    return currentStore.positivationsDetails.filter(pd => existingVendorIds.has(pd.vendorId));
  }, [currentStore, allVendors]);

  const positivacoesCount = useMemo(() => validPositivationsDetails.length, [validPositivationsDetails]);

  const sortedAwardTiersForDisplay = useMemo(() => {
    if (!currentStore || !currentStore.state || awardTiers.length === 0) {
      return [...awardTiers].sort((a,b) => {
        const aReq = a.positivacoesRequired.PR || 0; // Fallback to PR if specific state req not found
        const bReq = b.positivacoesRequired.PR || 0;
        return aReq - bReq;
      });
    }
    const storeState = currentStore.state;
    return [...awardTiers].sort((a, b) => 
        getRequiredPositivationsForStore(a, storeState) - getRequiredPositivationsForStore(b, storeState)
    );
  }, [awardTiers, currentStore]);

  const currentAchievedTier = useMemo(() => {
    if (!currentStore || sortedAwardTiersForDisplay.length === 0 || !currentStore.state) return undefined;
    const storeState = currentStore.state;
    let achievedTier: AwardTier | undefined = undefined;
    for (let i = sortedAwardTiersForDisplay.length - 1; i >= 0; i--) {
        if (positivacoesCount >= getRequiredPositivationsForStore(sortedAwardTiersForDisplay[i], storeState)) {
            achievedTier = sortedAwardTiersForDisplay[i];
            break;
        }
    }
    return achievedTier;
  }, [sortedAwardTiersForDisplay, positivacoesCount, currentStore]);

  const nextTier = useMemo(() => {
    if (!currentStore || sortedAwardTiersForDisplay.length === 0 || !currentStore.state) return undefined;
    
    if (currentAchievedTier) {
        const currentTierIndex = sortedAwardTiersForDisplay.findIndex(t => t.id === currentAchievedTier!.id);
        if (currentTierIndex < sortedAwardTiersForDisplay.length - 1) {
            return sortedAwardTiersForDisplay[currentTierIndex + 1];
        }
        return undefined; // Max tier achieved
    }
    // If no tier achieved and there are tiers available, next tier is the first one
    return sortedAwardTiersForDisplay.length > 0 ? sortedAwardTiersForDisplay[0] : undefined;
  }, [sortedAwardTiersForDisplay, currentAchievedTier, currentStore]);

  const progressToNextTier = useMemo(() => {
    if (!currentStore || !nextTier || !currentStore.state) return currentAchievedTier ? 100 : 0;
    const storeState = currentStore.state;
    const requiredForNext = getRequiredPositivationsForStore(nextTier, storeState);

    if (requiredForNext === 0) return positivacoesCount > 0 ? 100 : 0; // Achieved if needs 0 and has any, else 0
    
    const progress = (positivacoesCount / requiredForNext) * 100;
    return Math.min(progress, 100);
  }, [nextTier, positivacoesCount, currentAchievedTier, currentStore]);


  const positivationsMap = useMemo(() => {
    const map = new Map<string, PositivationDetail>();
    validPositivationsDetails.forEach(detail => {
      map.set(detail.vendorId, detail);
    });
    return map;
  }, [validPositivationsDetails]);

  if (!user || !currentEvent) {
    return (
      <div className="animate-fadeIn p-6">
        <PageHeader title="Minhas Positivações" icon={Star} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Carregando dados...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentStore) {
     return (
      <div className="animate-fadeIn p-6">
        <PageHeader title="Minhas Positivações" icon={Star} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Dados da loja não encontrados para o usuário {user.name}.
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`${currentStore.code} - ${currentStore.name} (${currentStore.state || 'N/A'}) - Cartela de Positivações`}
        description={`Sua performance e selos recebidos no ${currentEvent.name}`}
        icon={Star}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos Recebidos</CardTitle>
            <BadgeCheck className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{positivacoesCount}</div>
            <p className="text-xs text-muted-foreground">De fornecedores participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa de Premiação Atual</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentAchievedTier ? currentAchievedTier.name : 'Nenhuma'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAchievedTier ? `Prêmio: ${currentAchievedTier.rewardName}` : 'Continue coletando selos!'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Próxima Faixa</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {nextTier && currentStore.state ? (
              <>
                <div className="text-xl font-bold">{positivacoesCount} / {getRequiredPositivationsForStore(nextTier, currentStore.state)} selos</div>
                <Progress value={progressToNextTier} className="mt-2 h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam {Math.max(0, getRequiredPositivationsForStore(nextTier, currentStore.state) - positivacoesCount)} selos para a faixa {nextTier.name}!
                </p>
              </>
            ) : (
              currentAchievedTier ? (
                  <>
                  <div className="text-xl font-bold">Parabéns!</div>
                  <p className="text-xs text-muted-foreground mt-1">Você atingiu a faixa máxima de premiação!</p>
                  </>
              ) : ( // No next tier and no current tier (implies no tiers exist or store state missing)
                  <>
                  <div className="text-xl font-bold">
                    0 / {awardTiers.length > 0 && currentStore.state && sortedAwardTiersForDisplay[0] ? getRequiredPositivationsForStore(sortedAwardTiersForDisplay[0], currentStore.state) : (awardTiers.length > 0 && sortedAwardTiersForDisplay[0] ? (sortedAwardTiersForDisplay[0].positivacoesRequired.PR || '0') : '-')} selos
                  </div>
                    <Progress value={0} className="mt-2 h-3" />
                  <p className="text-xs text-muted-foreground mt-1">Nenhuma faixa de premiação configurada ou dados da loja incompletos.</p>
                  </>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Sua Cartela de Selos de Fornecedores</CardTitle>
          <CardDescription>Veja quais fornecedores já te positivaram e por qual vendedor.</CardDescription>
        </CardHeader>
        <CardContent>
          {allVendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado para o evento.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {allVendors.map((vendor: Vendor) => {
                const positivation = positivationsMap.get(vendor.id);
                const isPositivated = !!positivation;

                return (
                  <div
                    key={vendor.id}
                    className={`
                      flex flex-col items-center p-4 rounded-lg transition-all duration-300 ease-in-out border
                      ${isPositivated ? 'border-secondary shadow-lg' : 'border-muted opacity-75 hover:opacity-100'}
                      bg-card hover:shadow-md text-center min-h-[180px] justify-between group
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <Avatar className="w-16 h-16 md:w-20 md:h-20 mb-2 transition-opacity duration-300">
                        <AvatarImage src={vendor.logoUrl} alt={vendor.name} className="object-contain" />
                        <AvatarFallback>{vendor.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <p className={`
                        text-sm font-semibold text-center w-full
                        ${isPositivated ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                      `}>{vendor.name}</p>
                    </div>

                    <div className="text-xs mt-2 w-full">
                      {isPositivated && positivation?.salespersonName && positivation.date && isValid(parseISO(positivation.date)) ? (
                        <>
                          <p className="text-secondary flex items-center justify-center">
                            <BadgeCheck className="inline-block h-3.5 w-3.5 mr-1 text-secondary" />
                            <span className="font-semibold">Positivado por: {positivation.salespersonName}</span>
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Em: {format(parseISO(positivation.date), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </>
                      ) : isPositivated && positivation && positivation.date && isValid(parseISO(positivation.date)) ? (
                         <>
                          <p className="text-secondary flex items-center justify-center">
                            <BadgeCheck className="inline-block h-3.5 w-3.5 mr-1 text-secondary" />
                            <span className="font-semibold">Positivado!</span>
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Em: {format(parseISO(positivation.date), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                         </>
                      ) : (
                        <p className="text-muted-foreground">Ainda não positivado</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {positivacoesCount === 0 && allVendors.length > 0 && (
            <p className="mt-8 text-center text-lg text-muted-foreground">
              Ainda não há selos (positivações). Interaja com os fornecedores para recebê-los!
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-8">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="h-6 w-6 text-primary"/>
          <CardTitle>Faixas de Premiação Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAwardTiersForDisplay.length > 0 && currentStore.state ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Faixa</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead className="text-right">Qtd. Total Prêmios</TableHead>
                  <TableHead className="text-right">Selos Necessários ({currentStore.state})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAwardTiersForDisplay.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{tier.rewardName}</TableCell>
                    <TableCell className="text-right">{tier.quantityAvailable}</TableCell>
                    <TableCell className="text-right font-semibold">{getRequiredPositivationsForStore(tier, currentStore.state!)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma faixa de premiação configurada para o evento ou estado da loja não definido.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-2">
              <Gift className="h-6 w-6 text-secondary"/>
              <CardTitle>Qualificação para Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="text-sm">Sua loja tem <span className="font-bold text-lg text-secondary">{positivacoesCount}</span> selos.</p>
          <p className="text-xs text-muted-foreground mt-1">Lojas com mais selos e que atingem as faixas de premiação participam de sorteios especiais. Continue positivando!</p>
          </CardContent>
      </Card>
    </div>
  );
}

