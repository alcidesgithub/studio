
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { loadAwardTiers, loadStores, loadEvent, loadDrawnWinners, saveDrawnWinners } from '@/lib/localStorageUtils';
import type { AwardTier, Store, Event as EventType, SweepstakeWinnerRecord } from '@/types';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import { Dice6, ListChecks, Trophy, Download, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const exportToCSV = (data: any[], filename: string) => {
  if (typeof window === "undefined") return;
  const header = Object.keys(data[0]).join(",");
  const csvRows = data.map(row =>
    Object.values(row).map(value => {
      let stringValue = String(value);
      if (value instanceof Date) {
        stringValue = format(new Date(value), "yyyy-MM-dd HH:mm:ss", { locale: ptBR });
      }
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",")
  );

  const csvContent = "data:text/csv;charset=utf-8," + [header, ...csvRows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AdminTieredSweepstakesPage() {
  const [drawnWinners, setDrawnWinners] = useState<SweepstakeWinnerRecord[]>([]);
  const [isLoadingDraw, setIsLoadingDraw] = useState<string | null>(null);
  const { toast } = useToast();

  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);

  useEffect(() => {
    // Carrega as faixas e ordena pelo sortOrder definido pelo usuário
    setAwardTiers(loadAwardTiers().sort((a,b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)));
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    setDrawnWinners(loadDrawnWinners());
  }, []);

  useEffect(() => {
    if (drawnWinners.length > 0 || localStorage.getItem('hiperfarma_drawn_winners')) {
        saveDrawnWinners(drawnWinners);
    }
  }, [drawnWinners]);


  const awardTiersWithStats = useMemo(() => {
    const allDrawnStoreIds = new Set(drawnWinners.map(w => w.storeId)); // Stores that have won any prize

    return awardTiers.map(tier => {
      const winnersForThisTier = drawnWinners.filter(w => w.tierId === tier.id).sort((a,b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime());
      const remainingQuantity = tier.quantityAvailable - winnersForThisTier.length;

      const eligibleStoresForTier = stores.filter(store => {
        if (!store.state) return false; // Ensure store has a state for requirement lookup
        const requiredPositivations = getRequiredPositivationsForStore(tier, store.state);
        const meetsPositivationRequirement = (store.positivationsDetails?.length || 0) >= requiredPositivations;
        
        // Check if the store has ALREADY WON ANY PRIZE IN ANY TIER
        const hasNotWonAnyPrizeYet = !allDrawnStoreIds.has(store.id);
        
        return store.participating && meetsPositivationRequirement && hasNotWonAnyPrizeYet;
      });

      return {
        ...tier,
        remainingQuantity,
        eligibleStores: eligibleStoresForTier,
        winners: winnersForThisTier, // Still show winners for *this* tier
      };
    });
  }, [drawnWinners, awardTiers, stores]);

  const handleDrawWinner = async (tier: typeof awardTiersWithStats[0]) => {
    if (tier.remainingQuantity <= 0 || tier.eligibleStores.length === 0) {
      toast({ title: "Não é Possível Sortear", description: "Nenhum prêmio restante nesta faixa ou nenhuma loja elegível (que ainda não ganhou).", variant: "default" });
      return;
    }

    setIsLoadingDraw(tier.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const randomIndex = Math.floor(Math.random() * tier.eligibleStores.length);
    const winningStore = tier.eligibleStores[randomIndex];

    const newWinnerRecord: SweepstakeWinnerRecord = {
      tierId: tier.id,
      tierName: tier.name,
      prizeName: tier.rewardName,
      storeId: winningStore.id,
      storeName: `${winningStore.code} - ${winningStore.name} (CNPJ: ${winningStore.cnpj}, Estado: ${winningStore.state || 'N/A'})`,
      drawnAt: new Date(),
    };

    setDrawnWinners(prev => [...prev, newWinnerRecord]);
    setIsLoadingDraw(null);
    toast({
      title: "Vencedor Sorteado!",
      description: `${winningStore.name} ganhou o prêmio ${tier.rewardName} (da faixa ${tier.name}). Esta loja não poderá ser sorteada novamente.`,
    });
  };

  const handleExportLog = () => {
    if (drawnWinners.length === 0) {
      toast({ title: "Nenhum vencedor para exportar", description: "Sorteie alguns vencedores primeiro.", variant: "default" });
      return;
    }
    const dataToExport = drawnWinners.map(r => ({
      Faixa: r.tierName,
      Premio: r.prizeName,
      Loja_Vencedora_Detalhes: r.storeName,
      SorteadoEm: format(new Date(r.drawnAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    }));
    exportToCSV(dataToExport, `log_vencedores_sorteio_faixas_${currentEvent?.name.replace(/\s+/g, '_') || 'evento'}`);
    toast({ title: "Log Exportado", description: "O log de vencedores do sorteio foi exportado para um arquivo CSV." });
  };

  if (!currentEvent) {
    return <div>Carregando dados do sorteio...</div>
  }

  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8">
      <PageHeader
        title="Gerenciamento de Sorteios por Faixa"
        description={`Sorteie vencedores para cada faixa de premiação no ${currentEvent.name}. Cada loja pode ganhar apenas uma vez. A ordem das faixas abaixo respeita a configuração da tela de Gerenciamento de Faixas.`}
        icon={Dice6}
        actions={
          <Button onClick={handleExportLog} variant="outline" disabled={drawnWinners.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4 text-secondary" /> Exportar Log (CSV)
          </Button>
        }
      />

      {awardTiersWithStats.length === 0 && (
        <Card><CardContent className="p-4 sm:p-6 text-center text-muted-foreground">Nenhuma faixa de premiação configurada.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {awardTiersWithStats.map((tier) => (
          <Card key={tier.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Trophy className="text-secondary h-5 w-5 sm:h-6 sm:w-6" /> Faixa {tier.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tipo de Prêmio: <span className="font-semibold">{tier.rewardName}</span> <br />
                Requer (PR/SC): <span className="font-semibold">{tier.positivacoesRequired.PR} / {tier.positivacoesRequired.SC}</span> selos. <br />
                Total de Prêmios: <span className="font-semibold">{tier.quantityAvailable}</span> | Restantes: <span className="font-semibold">{tier.remainingQuantity}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-xs sm:text-sm mb-1 flex items-center gap-1"><ListChecks className="text-secondary h-4 w-4 sm:h-5 sm:w-5" /> Lojas Elegíveis ({tier.eligibleStores.length}):</h4>
                {tier.eligibleStores.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-20 sm:max-h-24 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {tier.eligibleStores.map(store =>
                      <li key={store.id}>{store.code} - {store.name} ({store.state}, Selos: {store.positivationsDetails?.length || 0})</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground p-2">Nenhuma loja elegível para o sorteio desta faixa (ou todas já ganharam um prêmio).</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-xs sm:text-sm mb-1">Slots de Prêmios para esta Faixa:</h4>
                {Array.from({ length: tier.quantityAvailable }).map((_, prizeIndex) => {
                  const winnerRecord = tier.winners[prizeIndex];
                  const isSlotDrawn = !!winnerRecord;
                  const canDrawForThisSlot = !isSlotDrawn && tier.eligibleStores.length > 0 && tier.remainingQuantity > 0;

                  return (
                    <div key={prizeIndex} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                      <div className="text-xs sm:text-sm flex-1">
                        <span className="font-medium text-primary block">{tier.rewardName} - Prêmio #{prizeIndex + 1}</span>
                        {isSlotDrawn && winnerRecord ? (
                          <p className="text-xs text-green-700 font-semibold mt-1">
                            Ganho por: {winnerRecord.storeName}
                            <span className="text-muted-foreground font-normal block"> ({format(new Date(winnerRecord.drawnAt), "dd/MM HH:mm", { locale: ptBR })})</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Disponível para sorteio</p>
                        )}
                      </div>
                      {!isSlotDrawn && (
                        <Button
                          size="sm"
                          onClick={() => handleDrawWinner(tier)}
                          disabled={!canDrawForThisSlot || isLoadingDraw === tier.id}
                          variant={canDrawForThisSlot ? "default" : "outline"}
                          className="w-24 sm:w-28 ml-2 text-xs sm:text-sm"
                        >
                          {isLoadingDraw === tier.id ? (
                            <PlayCircle className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-secondary" />
                          ) : (
                            <PlayCircle className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
                          )}
                          {isLoadingDraw === tier.id ? "Sorteando..." : "Sortear"}
                        </Button>
                      )}
                       {isSlotDrawn && (
                        <div className="w-24 sm:w-28 text-right ml-2">
                            <span className="text-xs text-green-600 font-bold">PREMIADO</span>
                        </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-xl mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle>Log de Vencedores do Sorteio</CardTitle>
          <CardDescription>Histórico de todos os vencedores sorteados em todas as faixas e slots de prêmios.</CardDescription>
        </CardHeader>
        <CardContent>
          {drawnWinners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 sm:px-4">Faixa</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Prêmio</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Loja Vencedora (Código - Razão Social - CNPJ - Estado)</TableHead>
                    <TableHead className="text-right px-2 py-3 sm:px-4">Sorteado Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drawnWinners.sort((a,b) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime()).map((record, index) => (
                    <TableRow key={`${record.tierId}-${record.storeId}-${index}`}>
                      <TableCell className="font-medium px-2 py-3 sm:px-4">{record.tierName}</TableCell>
                      <TableCell className="px-2 py-3 sm:px-4">{record.prizeName}</TableCell>
                      <TableCell className="font-semibold px-2 py-3 sm:px-4 break-words">{record.storeName}</TableCell>
                      <TableCell className="text-right text-xs px-2 py-3 sm:px-4">{format(new Date(record.drawnAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum vencedor sorteado ainda. Comece sorteando vencedores nos slots de prêmios acima.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
