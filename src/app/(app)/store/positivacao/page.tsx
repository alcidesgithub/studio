
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loadStores, loadAwardTiers, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, AwardTier, PositivationDetail, Vendor, Event as EventType } from '@/types';
import { Star, Trophy, TrendingUp, Gift, BadgeCheck } from 'lucide-react'; 
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
    setAwardTiers(loadAwardTiers().sort((a,b) => a.positivacoesRequired - b.positivacoesRequired));
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const currentStore = useMemo(() => {
    if (!user || !user.storeName) return undefined;
    return allStores.find(s => s.name === user.storeName);
  }, [user, allStores]);

  const positivacoesCount = useMemo(() => currentStore?.positivationsDetails?.length || 0, [currentStore]);

  const currentAchievedTier = useMemo(() => {
    if (!currentStore || awardTiers.length === 0) return undefined;
    let achievedTier: AwardTier | undefined = undefined;
    for (let i = awardTiers.length - 1; i >= 0; i--) {
      if (positivacoesCount >= awardTiers[i].positivacoesRequired) {
        achievedTier = awardTiers[i];
        break; 
      }
    }
    return achievedTier;
  }, [currentStore, awardTiers, positivacoesCount]);
  
  const nextTier = useMemo(() => {
    if (awardTiers.length === 0) return undefined;
    if (currentAchievedTier) {
      const currentTierIndex = awardTiers.findIndex(t => t.id === currentAchievedTier!.id);
      if (currentTierIndex < awardTiers.length - 1) {
        return awardTiers[currentTierIndex + 1];
      }
      return undefined; // Max tier achieved
    }
    return awardTiers[0]; // First tier if none achieved
  }, [awardTiers, currentAchievedTier]);

  const progressToNextTier = useMemo(() => {
    if (!nextTier) return currentAchievedTier ? 100 : 0;
    return (positivacoesCount / nextTier.positivacoesRequired) * 100;
  }, [nextTier, positivacoesCount, currentAchievedTier]);

  const positivationsMap = useMemo(() => {
    const map = new Map<string, PositivationDetail>();
    currentStore?.positivationsDetails?.forEach(detail => {
      map.set(detail.vendorId, detail);
    });
    return map;
  }, [currentStore]);

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
        title={`${currentStore.name} - Cartela de Positivações`}
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
            {nextTier ? (
              <>
                <div className="text-xl font-bold">{positivacoesCount} / {nextTier.positivacoesRequired} selos</div>
                <Progress value={progressToNextTier > 100 ? 100 : progressToNextTier} className="mt-2 h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam {Math.max(0, nextTier.positivacoesRequired - positivacoesCount)} selos para a faixa {nextTier.name}!
                </p>
              </>
            ) : (
              currentAchievedTier ? (
                  <>
                  <div className="text-xl font-bold">Parabéns!</div>
                  <p className="text-xs text-muted-foreground mt-1">Você atingiu a faixa máxima de premiação!</p>
                  </>
              ) : (
                  <>
                  <div className="text-xl font-bold">0 / {awardTiers.length > 0 ? awardTiers[0].positivacoesRequired : '-'} selos</div>
                    <Progress value={0} className="mt-2 h-3" />
                  <p className="text-xs text-muted-foreground mt-1">Comece a coletar selos!</p>
                  </>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Sua Cartela de Selos de Fornecedores</CardTitle>
          <CardDescription>Veja quais fornecedores já te positivaram e por qual vendedor.</CardDescription>
        </CardHeader>
        <CardContent>
          {allVendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado para o evento.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
                      {isPositivated && positivation?.salespersonName && isValid(parseISO(positivation.date)) ? (
                        <>
                          <p className="text-secondary flex items-center justify-center">
                            <BadgeCheck className="inline-block h-3.5 w-3.5 mr-1 text-secondary" />
                            <span className="font-semibold">Positivado por: {positivation.salespersonName}</span>
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            Em: {format(parseISO(positivation.date), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </>
                      ) : isPositivated && positivation && isValid(parseISO(positivation.date)) ? (
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

