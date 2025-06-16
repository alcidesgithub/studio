
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { VendorPositivationDisplayCard } from '@/components/cards/VendorPositivationDisplayCard';
import { useAuth } from '@/hooks/use-auth';
import { loadStores, loadAwardTiers, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import type { Store, AwardTier, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { Trophy, TrendingUp, Gift, BadgeCheck, ArrowLeftCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function BranchDetailPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;

  const [allStores, setAllStores] = useState<Store[]>([]);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  // accessDenied state is removed

  useEffect(() => {
    setDataLoading(true);
    setAllStores(loadStores());
    setAwardTiers(loadAwardTiers().sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)));
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
    setDataLoading(false);
  }, []);

  const loggedInStore = useMemo(() => {
    if (!user || user.role !== 'store' || !user.email) return undefined;
    return allStores.find(s => s.email === user.email);
  }, [user, allStores]);

  const branchStore = useMemo(() => {
    if (!branchId || allStores.length === 0) return undefined;
    return allStores.find(s => s.id === branchId);
  }, [branchId, allStores]);

  const positivationsDetailsForBranch = useMemo(() => {
    if (!branchStore || !branchStore.positivationsDetails || allVendors.length === 0) return [];
    const existingVendorIds = new Set(allVendors.map(v => v.id));
    return branchStore.positivationsDetails.filter(pd => existingVendorIds.has(pd.vendorId));
  }, [branchStore, allVendors]);

  const positivacoesCountForBranch = useMemo(() => positivationsDetailsForBranch.length, [positivationsDetailsForBranch]);

  const currentAchievedTierForBranch = useMemo(() => {
    if (!branchStore || awardTiers.length === 0 || !branchStore.state) return undefined;
    const storeStateForRequirements = branchStore.state;
    let achievedTier: AwardTier | undefined = undefined;
    for (let i = awardTiers.length - 1; i >= 0; i--) {
        const tier = awardTiers[i];
        if (positivacoesCountForBranch >= getRequiredPositivationsForStore(tier, storeStateForRequirements)) {
            achievedTier = tier;
            break;
        }
    }
    return achievedTier;
  }, [awardTiers, positivacoesCountForBranch, branchStore]);

  const nextTierForBranch = useMemo(() => {
    if (!branchStore || awardTiers.length === 0 || !branchStore.state) return undefined;
    if (currentAchievedTierForBranch) {
        const currentTierIndex = awardTiers.findIndex(t => t.id === currentAchievedTierForBranch!.id);
        if (currentTierIndex < awardTiers.length - 1) {
            return awardTiers[currentTierIndex + 1];
        }
        return undefined;
    }
    return awardTiers.length > 0 ? awardTiers[0] : undefined;
  }, [awardTiers, currentAchievedTierForBranch, branchStore]);

  const progressToNextTierForBranch = useMemo(() => {
    if (!branchStore || !nextTierForBranch || !branchStore.state) return currentAchievedTierForBranch ? 100 : 0;
    const storeStateForRequirements = branchStore.state;
    const requiredForNext = getRequiredPositivationsForStore(nextTierForBranch, storeStateForRequirements);
    if (requiredForNext === 0) return positivacoesCountForBranch >= 0 ? 100 : 0;
    if (requiredForNext <= 0 || positivacoesCountForBranch < 0) return 0;
    const progress = (positivacoesCountForBranch / requiredForNext) * 100;
    return Math.min(progress, 100);
  }, [nextTierForBranch, positivacoesCountForBranch, currentAchievedTierForBranch, branchStore]);

  const positivationsMapForCartela = useMemo(() => {
    const map = new Map<string, PositivationDetail>();
    const detailsForCartela = branchStore?.positivationsDetails?.filter(pd => allVendors.some(v => v.id === pd.vendorId)) || [];
    detailsForCartela.forEach(detail => {
      map.set(detail.vendorId, detail);
    });
    return map;
  }, [branchStore, allVendors]);


  if (authIsLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Carregando dados da filial...</p>
      </div>
    );
  }

  // Access control checks after loading is complete
  if (!user) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Acesso Negado" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive rounded-md">
            <p className="text-lg font-semibold">Usuário não autenticado.</p>
            <Button onClick={() => router.push('/login')} className="mt-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'store') {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Acesso Negado" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive rounded-md">
            <p className="text-lg font-semibold">Você não tem permissão para ver esta página (tipo de usuário incorreto).</p>
            <Button onClick={() => router.push('/store/positivacao')} className="mt-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
              Voltar para Minhas Positivações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!loggedInStore) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Erro de Dados" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            <p className="text-lg font-semibold">Dados da sua loja (matriz) não encontrados.</p>
            <p className="text-sm">Verifique se você está logado com a conta correta da loja matriz.</p>
            <Button onClick={() => router.push('/store/positivacao')} className="mt-4">
              Voltar para Minhas Positivações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loggedInStore.isMatrix) {
     return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Acesso Negado" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive rounded-md">
            <p className="text-lg font-semibold">Apenas lojas matriz podem visualizar detalhes de filiais.</p>
            <Button onClick={() => router.push('/store/positivacao')} className="mt-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
              Voltar para Minhas Positivações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!branchStore) {
     return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Filial Não Encontrada" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            <p className="text-lg font-semibold">Filial com ID '{branchId}' não encontrada.</p>
             <Button onClick={() => router.push('/store/positivacao')} className="mt-4">
              Voltar para Visão da Matriz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (branchStore.matrixStoreId !== loggedInStore.id) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Acesso Negado" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive rounded-md">
            <p className="text-lg font-semibold">Esta filial não pertence à sua loja matriz.</p>
            <Button onClick={() => router.push('/store/positivacao')} className="mt-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
              Voltar para Visão da Matriz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // At this point, all checks passed, currentEvent should also be loaded
  if (!currentEvent) {
     return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Erro" icon={AlertTriangle} iconClassName="text-destructive" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Não foi possível carregar os dados do evento.
             <Button onClick={() => router.push('/store/positivacao')} className="mt-4">
              Voltar para Minhas Positivações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = `Detalhes da Filial: ${branchStore.code} - ${branchStore.name} (${branchStore.state || 'N/A'})`;
  const pageDescription = `Performance e selos recebidos no ${currentEvent.name}.`;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={BadgeCheck}
        iconClassName="text-secondary"
        actions={
          <Button asChild variant="outline">
            <Link href="/store/positivacao">
              <ArrowLeftCircle className="mr-2 h-4 w-4" /> Voltar para Visão da Matriz
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Selos Recebidos</CardTitle>
            <BadgeCheck className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{positivacoesCountForBranch}</div>
            <p className="text-xs text-muted-foreground">De fornecedores participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa de Premiação Atual</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {currentAchievedTierForBranch ? currentAchievedTierForBranch.name : 'Nenhuma'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAchievedTierForBranch ? `Prêmio: ${currentAchievedTierForBranch.rewardName}` : 'Continue coletando selos!'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Próxima Faixa</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {nextTierForBranch && branchStore.state ? (
              <>
                <div className="text-lg sm:text-xl font-bold">{positivacoesCountForBranch} / {getRequiredPositivationsForStore(nextTierForBranch, branchStore.state)} selos</div>
                <Progress value={progressToNextTierForBranch} className="mt-2 h-2.5 sm:h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam {Math.max(0, getRequiredPositivationsForStore(nextTierForBranch, branchStore.state) - positivacoesCountForBranch)} selos para a faixa {nextTierForBranch.name}!
                </p>
              </>
            ) : (
              currentAchievedTierForBranch ? (
                  <>
                  <div className="text-lg sm:text-xl font-bold">Parabéns!</div>
                  <p className="text-xs text-muted-foreground mt-1">Você atingiu a faixa máxima de premiação!</p>
                  </>
              ) : (
                 <>
                  <div className="text-lg sm:text-xl font-bold">
                    {positivacoesCountForBranch} / {awardTiers.length > 0 && branchStore.state && awardTiers[0] ? getRequiredPositivationsForStore(awardTiers[0], branchStore.state) : (awardTiers.length > 0 && awardTiers[0] ? (awardTiers[0].positivacoesRequired.PR || '0') : '-')} selos
                  </div>
                  <Progress value={progressToNextTierForBranch} className="mt-2 h-2.5 sm:h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {awardTiers.length === 0 ? "Nenhuma faixa de premiação configurada." : (branchStore.state ? "Comece a coletar selos!" : "Dados do estado da filial incompletos.")}
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
          <CardDescription className="text-white">
            Veja quais fornecedores já positivaram esta filial e por qual vendedor.
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
          {positivationsDetailsForBranch.length === 0 && allVendors.length > 0 && (
            <p className="mt-6 sm:mt-8 text-center text-base sm:text-lg text-white/50">
              Ainda não há selos (positivações) para esta filial.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-6 sm:mb-8">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-secondary"/>
          <CardTitle>Faixas de Premiação Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {awardTiers.length > 0 && branchStore.state ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 sm:px-4">Nome da Faixa</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Prêmio</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Qtd. Total Prêmios</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Selos Necessários ({branchStore.state})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awardTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium px-2 py-3 sm:px-4">{tier.name}</TableCell>
                      <TableCell className="px-2 py-3 sm:px-4 break-words">{tier.rewardName}</TableCell>
                      <TableCell className="text-right px-2 py-3 sm:px-4">{tier.quantityAvailable}</TableCell>
                      <TableCell className="text-right font-semibold px-2 py-3 sm:px-4">{getRequiredPositivationsForStore(tier, branchStore.state!)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma faixa de premiação configurada para o evento ou estado da filial não definido.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 sm:mt-8 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-2">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-secondary"/>
              <CardTitle>Qualificação para Sorteios</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="text-sm">Esta filial (<span className="font-semibold">{branchStore.name}</span>) tem <span className="font-bold text-base sm:text-lg text-secondary">{positivacoesCountForBranch}</span> selos.</p>
          <p className="text-xs text-muted-foreground mt-1">Filiais com mais selos e que atingem as faixas de premiação participam de sorteios especiais. Continue positivando!</p>
          </CardContent>
      </Card>
    </div>
  );
}

    