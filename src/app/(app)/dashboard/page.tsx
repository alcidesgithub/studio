"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MOCK_STORES, MOCK_EVENT } from '@/lib/constants';
import { Users, CheckCircle, Target, Building, ThumbsUp, LayoutDashboard } from 'lucide-react';
// import type { Metadata } from 'next'; // Comentado pois esta é uma página de cliente

export default function DashboardPage() {
  const participatingStores = MOCK_STORES.filter(s => s.participating).length;
  const totalPositivacoes = MOCK_STORES.reduce((sum, s) => sum + (s.positivationsDetails?.length || 0), 0);
  const averageGoalProgress = MOCK_STORES.length > 0
    ? MOCK_STORES.reduce((sum, s) => sum + s.goalProgress, 0) / MOCK_STORES.length
    : 0;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Painel do Evento"
        description={`Visão geral do ${MOCK_EVENT.name}`}
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas Participantes</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participatingStores}</div>
            <p className="text-xs text-muted-foreground">de {MOCK_STORES.length} lojas no total</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Positivações</CardTitle>
            <ThumbsUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositivacoes}</div>
            <p className="text-xs text-muted-foreground">Em todas as lojas participantes</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio das Lojas</CardTitle>
            <Target className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGoalProgress.toFixed(0)}%</div>
            <Progress value={averageGoalProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 font-headline">Visão Rápida das Lojas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_STORES.slice(0,3).map(store => (
            <Card key={store.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary"/>
                  {store.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Positivações: <span className="font-semibold">{store.positivationsDetails?.length || 0}</span></p>
                <div className="flex items-center gap-2">
                  <p className="text-sm">Progresso: </p><Progress value={store.goalProgress} className="flex-1 h-2" /> <span className="text-sm font-semibold">{store.goalProgress}%</span>
                </div>
                {store.currentTier && <p className="text-sm">Faixa: <span className="font-semibold text-accent">{store.currentTier.name}</span></p>}
                 <p className="text-xs text-muted-foreground">{store.participating ? "Participando" : "Não participando"}</p>
              </CardContent>
            </Card>
          ))}
           {MOCK_STORES.length === 0 && <p className="text-muted-foreground text-center col-span-full">Nenhuma loja cadastrada.</p>}
        </div>
      </div>
    </div>
  );
}
