
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { MOCK_STORES, MOCK_AWARD_TIERS, MOCK_EVENT, MOCK_VENDORS } from '@/lib/constants'; // No longer use mocks directly
import { loadStores, loadAwardTiers, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, AwardTier, PositivationDetail, Vendor, Event as EventType } from '@/types';
import { Star, ThumbsUp, Medal, TrendingUp, CheckCircle, Gift } from 'lucide-react';
import Image from 'next/image';
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
        <PageHeader title="Minha Cartela de Selos" icon={Star} />
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
        <PageHeader title="Minha Cartela de Selos" icon={Star} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Dados da loja não encontrados para o usuário {user.name}.
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <TooltipProvider>
      <div className="animate-fadeIn">
        <PageHeader
          title={`${currentStore.name} - Cartela de Selos`}
          description={`Sua performance e selos recebidos no ${currentEvent.name}`}
          icon={Star}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Selos Recebidos</CardTitle>
              <ThumbsUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{positivacoesCount}</div>
              <p className="text-xs text-muted-foreground">De fornecedores participantes</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faixa de Premiação Atual</CardTitle>
              <Medal className="h-5 w-5 text-accent" />
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
              <TrendingUp className="h-5 w-5 text-accent" />
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
            <CardDescription>Veja quais fornecedores já te prestigiaram neste evento.</CardDescription>
          </CardHeader>
          <CardContent>
            {allVendors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado para o evento.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {allVendors.map((vendor: Vendor) => {
                  const positivation = positivationsMap.get(vendor.id);
                  const isPositivated = !!positivation;

                  return (
                    <Tooltip key={vendor.id} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className={`
                          flex flex-col items-center justify-center p-3 aspect-square
                          border-4 rounded-full transition-all duration-300 ease-in-out
                          ${isPositivated ? 'border-accent shadow-lg scale-105' : 'border-muted opacity-60 hover:opacity-100'}
                          bg-card hover:shadow-md cursor-default group
                        `}>
                          <Avatar className="w-16 h-16 md:w-20 md:h-20 mb-2 transition-opacity duration-300">
                            <AvatarImage src={vendor.logoUrl} alt={vendor.name} data-ai-hint={vendor.dataAiHint || "company logo"} className="object-contain" />
                            <AvatarFallback>{vendor.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <p className={`
                            text-xs font-medium text-center truncate w-full
                            ${isPositivated ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                          `}>{vendor.name}</p>
                           {isPositivated && <CheckCircle className="w-5 h-5 text-accent absolute top-2 right-2" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-background border-border shadow-xl p-3">
                        <p className="font-semibold text-lg text-primary">{vendor.name}</p>
                        {isPositivated && positivation && isValid(parseISO(positivation.date)) ? (
                          <>
                            <p className="text-sm text-green-600">
                              <ThumbsUp className="inline-block h-4 w-4 mr-1" /> Positivado!
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Em: {format(parseISO(positivation.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Ainda não positivado</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
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
                <Gift className="h-6 w-6 text-primary"/>
                <CardTitle>Qualificação para Sorteios</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-sm">Sua loja tem <span className="font-bold text-lg text-accent">{currentStore.positivationsDetails.length}</span> selos.</p>
            <p className="text-xs text-muted-foreground mt-1">Lojas com mais selos e que atingem as faixas de premiação participam de sorteios especiais. Continue engajando!</p>
            </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
