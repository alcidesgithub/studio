
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { loadAwardTiers, loadStores, loadEvent, loadDrawnWinners, saveDrawnWinners } from '@/lib/localStorageUtils';
import type { AwardTier, Store, Event as EventType, SweepstakeWinnerRecord } from '@/types';
import { getRequiredPositivationsForStore } from '@/lib/utils';
import { Dice6, ListChecks, Trophy, Download, PlayCircle, RotateCcw, Trash2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SweepstakeAnimationDialog = dynamic(() =>
  import('@/components/dialogs/SweepstakeAnimationDialog').then((mod) => mod.SweepstakeAnimationDialog),
  { ssr: false, loading: () => <p>Carregando diálogo do sorteio...</p> }
);


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

export type AwardTierWithStats = AwardTier & {
  remainingQuantity: number;
  eligibleStores: Store[];
  winners: SweepstakeWinnerRecord[];
};


export default function AdminTieredSweepstakesPage() {
  const [drawnWinners, setDrawnWinners] = useState<SweepstakeWinnerRecord[]>([]);
  const { toast } = useToast();

  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);

  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false);
  const [tierToReset, setTierToReset] = useState<AwardTierWithStats | null>(null);
  const [winnerToDelete, setWinnerToDelete] = useState<SweepstakeWinnerRecord | null>(null);

  const [isSweepstakeDialogOpen, setIsSweepstakeDialogOpen] = useState(false);
  const [currentTierForDialog, setCurrentTierForDialog] = useState<AwardTierWithStats | null>(null);


  useEffect(() => {
    setAwardTiers(loadAwardTiers().sort((a,b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)));
    setStores(loadStores());
    setCurrentEvent(loadEvent());
    setDrawnWinners(loadDrawnWinners());
  }, []);


  const awardTiersWithStats = useMemo((): AwardTierWithStats[] => {
    const allDrawnStoreIds = new Set(drawnWinners.map(w => w.storeId));

    return awardTiers.map(tier => {
      const winnersForThisTier = drawnWinners.filter(w => w.tierId === tier.id).sort((a,b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime());
      const remainingQuantity = tier.quantityAvailable - winnersForThisTier.length;

      const eligibleStoresForTier = stores.filter(store => {
        if (!store.state) return false;
        const requiredPositivations = getRequiredPositivationsForStore(tier, store.state);
        const meetsPositivationRequirement = (store.positivationsDetails?.length || 0) >= requiredPositivations;
        const hasNotWonAnyPrizeYet = !allDrawnStoreIds.has(store.id);
        
        return store.participating && store.isCheckedIn && meetsPositivationRequirement && hasNotWonAnyPrizeYet;
      });

      return {
        ...tier,
        remainingQuantity,
        eligibleStores: eligibleStoresForTier,
        winners: winnersForThisTier,
      };
    });
  }, [drawnWinners, awardTiers, stores]);


  const openSweepstakeDialog = (tier: AwardTierWithStats) => {
     if (tier.remainingQuantity <= 0 || tier.eligibleStores.length === 0) {
      toast({ title: "Não é Possível Sortear", description: "Nenhum prêmio restante nesta faixa ou nenhuma loja elegível.", variant: "default" });
      return;
    }
    setCurrentTierForDialog(tier);
    setIsSweepstakeDialogOpen(true);
  };

  const handleSweepstakeConfirmed = useCallback((winningStore: Store) => {
    if (!currentTierForDialog) {
        toast({ title: "Erro no Sorteio", description: "Faixa de premiação não identificada.", variant: "destructive"});
        setIsSweepstakeDialogOpen(false);
        return;
    }

    const newWinnerRecord: SweepstakeWinnerRecord = {
      id: `winner_${currentTierForDialog.id}_${winningStore.id}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      tierId: currentTierForDialog.id,
      tierName: currentTierForDialog.name,
      prizeName: currentTierForDialog.rewardName,
      storeId: winningStore.id,
      storeName: `${winningStore.code} - ${winningStore.name} (CNPJ: ${winningStore.cnpj}, Estado: ${winningStore.state || 'N/A'})`,
      drawnAt: new Date(),
    };

    const updatedWinners = [...drawnWinners, newWinnerRecord];
    setDrawnWinners(updatedWinners);
    saveDrawnWinners(updatedWinners);

    toast({
      title: "Vencedor Sorteado!",
      description: `${winningStore.name} ganhou o prêmio ${currentTierForDialog.rewardName} (da faixa ${currentTierForDialog.name}). Esta loja não poderá ser sorteada novamente.`,
      variant: "success",
    });
    
    setIsSweepstakeDialogOpen(false);
    setCurrentTierForDialog(null);
  }, [currentTierForDialog, toast, drawnWinners]);


  const handleExportLog = useCallback(() => {
    if (drawnWinners.length === 0) {
      toast({ title: "Nenhum vencedor para exportar", description: "Sorteie alguns vencedores primeiro.", variant: "default" });
      return;
    }
    const dataToExport = drawnWinners.map(r => ({
      ID_Vencedor: r.id,
      Faixa_ID: r.tierId,
      Faixa_Nome: r.tierName,
      Premio_Nome: r.prizeName,
      Loja_ID: r.storeId,
      Loja_Vencedora_Detalhes: r.storeName,
      SorteadoEm: format(new Date(r.drawnAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    }));
    exportToCSV(dataToExport, `log_vencedores_sorteio_faixas_${currentEvent?.name.replace(/\s+/g, '_') || 'evento'}`);
    toast({ title: "Log Exportado", description: "O log de vencedores do sorteio foi exportado para um arquivo CSV.", variant: "success" });
  }, [drawnWinners, currentEvent, toast]);

  const confirmResetAllSweepstakes = useCallback(() => {
    if (drawnWinners.length === 0) {
      toast({ title: "Sorteio já está limpo", description: "Não há vencedores para resetar.", variant: "default" });
      return;
    }
    setIsResetAllConfirmOpen(true);
  }, [drawnWinners.length, toast]);

  const handleResetAllSweepstakes = useCallback(() => {
    setDrawnWinners([]);
    saveDrawnWinners([]); 
    toast({ title: "Sorteio Resetado", description: "Todos os vencedores sorteados foram removidos.", variant: "destructive" });
    setIsResetAllConfirmOpen(false);
  }, [toast]);

  const confirmResetTierSweepstakes = useCallback((tier: AwardTierWithStats) => {
     if (tier.winners.length === 0) {
      toast({ title: "Faixa já está limpa", description: `Não há vencedores para resetar na faixa ${tier.name}.`, variant: "default" });
      return;
    }
    setTierToReset(tier);
  }, [toast]);
  
  const handleResetTierSweepstakes = useCallback(() => {
    if (!tierToReset) return;
    const updatedWinners = drawnWinners.filter(w => w.tierId !== tierToReset.id);
    setDrawnWinners(updatedWinners);
    saveDrawnWinners(updatedWinners);
    toast({ title: "Faixa Resetada", description: `Todos os vencedores da faixa "${tierToReset.name}" foram removidos.`, variant: "destructive" });
    setTierToReset(null);
  }, [drawnWinners, tierToReset, toast]);

  const confirmDeleteSingleWinner = useCallback((winner: SweepstakeWinnerRecord) => {
    setWinnerToDelete(winner);
  }, []);

  const handleDeleteSingleWinner = useCallback(() => {
    if (!winnerToDelete) return;
    const updatedWinners = drawnWinners.filter(w => w.id !== winnerToDelete.id);
    setDrawnWinners(updatedWinners);
    saveDrawnWinners(updatedWinners);
    toast({ title: "Vencedor Removido", description: `O prêmio de "${winnerToDelete.storeName}" na faixa "${winnerToDelete.tierName}" foi removido.`, variant: "destructive" });
    setWinnerToDelete(null);
  }, [drawnWinners, winnerToDelete, toast]);


  if (!currentEvent) {
    return <div>Carregando dados do sorteio...</div>
  }

  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8">
      <PageHeader
        title="Sorteios por faixa"
        description="Sorteie vencedores para cada faixa de premiação. Cada loja pode ganhar apenas uma vez. Lojas devem ter check-in para serem elegíveis."
        icon={Dice6}
        iconClassName="text-secondary"
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={confirmResetAllSweepstakes} variant="destructive" disabled={drawnWinners.length === 0} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" /> Resetar Todos Sorteios
            </Button>
            <Button onClick={handleExportLog} variant="outline" disabled={drawnWinners.length === 0} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Exportar Log (CSV)
            </Button>
          </div>
        }
      />

      {isSweepstakeDialogOpen && currentTierForDialog && (
        <SweepstakeAnimationDialog
          isOpen={isSweepstakeDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsSweepstakeDialogOpen(false);
              setCurrentTierForDialog(null);
            }
          }}
          tier={currentTierForDialog}
          onConfirmWinner={handleSweepstakeConfirmed}
        />
      )}


      {awardTiersWithStats.length === 0 && (
        <Card><CardContent className="p-4 sm:p-6 text-center text-muted-foreground">Nenhuma faixa de premiação configurada.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {awardTiersWithStats.map((tier) => (
          <Card key={tier.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Trophy className="text-secondary h-5 w-5 sm:h-6 sm:w-6" /> Faixa {tier.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                        Prêmio: <span className="font-semibold">{tier.rewardName}</span> | Req. (PR/SC): <span className="font-semibold">{tier.positivacoesRequired.PR}/{tier.positivacoesRequired.SC}</span> <br/>
                        Total: <span className="font-semibold">{tier.quantityAvailable}</span> | Restantes: <span className="font-semibold">{tier.remainingQuantity}</span>
                    </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => confirmResetTierSweepstakes(tier)} 
                  disabled={tier.winners.length === 0}
                  className="text-xs hover:bg-destructive/10 hover:text-destructive"
                  title={`Resetar vencedores da faixa ${tier.name}`}
                >
                  <RotateCcw className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Resetar Faixa</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-xs sm:text-sm mb-1 flex items-center gap-1"><ListChecks className="text-secondary h-4 w-4 sm:h-5 sm:w-5" /> Lojas Elegíveis (Com Check-in: {tier.eligibleStores.length}):</h4>
                {tier.eligibleStores.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-20 sm:max-h-24 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {tier.eligibleStores.map(store =>
                      <li key={store.id}>{store.code} - {store.name} ({store.state}, Selos: {store.positivationsDetails?.length || 0})</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground p-2">Nenhuma loja elegível para o sorteio desta faixa (verifique check-in, prêmios já ganhos, ou se atingiram os selos necessários).</p>
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
                      {!isSlotDrawn ? (
                        <Button
                          size="lg"
                          onClick={() => openSweepstakeDialog(tier)}
                          disabled={!canDrawForThisSlot}
                          variant="default"
                          className="w-24 sm:w-28"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span className="ml-1.5">Sortear</span>
                        </Button>
                      ) : (
                        <div className="w-24 sm:w-28 text-right ml-2 flex flex-col items-end"> 
                            <span className="text-xs text-green-600 font-bold">PREMIADO</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive mt-0.5" onClick={() => winnerRecord && confirmDeleteSingleWinner(winnerRecord)} title="Resetar este slot (remover vencedor)">
                                <Trash2 className="h-3.5 w-3.5"/>
                                <span className="sr-only">Resetar Slot</span>
                            </Button>
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
        <CardHeader className="px-4 py-5 sm:p-6">
          <CardTitle>Log de Vencedores do Sorteio</CardTitle>
          <CardDescription>Histórico de todos os vencedores sorteados em todas as faixas e slots de prêmios.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          {drawnWinners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 sm:px-4">Faixa</TableHead>
                    <TableHead className="hidden sm:table-cell px-2 py-3 sm:px-4">Prêmio</TableHead>
                    <TableHead className="px-2 py-3 sm:px-4">Loja Vencedora</TableHead>
                    <TableHead className="hidden md:table-cell text-right px-2 py-3 sm:px-4">Sorteado Em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drawnWinners.sort((a,b) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime()).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium px-2 py-3 sm:px-4">{record.tierName}</TableCell>
                      <TableCell className="hidden sm:table-cell px-2 py-3 sm:px-4 break-words">{record.prizeName}</TableCell>
                      <TableCell className="font-semibold px-2 py-3 sm:px-4 break-words">{record.storeName}</TableCell>
                      <TableCell className="hidden md:table-cell text-right text-xs px-2 py-3 sm:px-4">{format(new Date(record.drawnAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
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

      <AlertDialog open={isResetAllConfirmOpen} onOpenChange={setIsResetAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Confirmar Reset Total do Sorteio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá TODOS os vencedores de TODAS as faixas de premiação. As lojas poderão ser sorteadas novamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllSweepstakes} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Resetar Tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tierToReset} onOpenChange={(open) => !open && setTierToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Confirmar Reset da Faixa "{tierToReset?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá todos os vencedores sorteados APENAS para a faixa "{tierToReset?.name}". As lojas que ganharam nesta faixa poderão ser sorteadas novamente (em qualquer faixa). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTierToReset(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTierSweepstakes} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Resetar Faixa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!winnerToDelete} onOpenChange={(open) => !open && setWinnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Confirmar Remoção de Vencedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o prêmio <span className="font-semibold">"{winnerToDelete?.prizeName}"</span> ganho por <span className="font-semibold">"{winnerToDelete?.storeName}"</span> na faixa <span className="font-semibold">"{winnerToDelete?.tierName}"</span>?
              <br/>A loja poderá ser sorteada novamente e este slot de prêmio ficará disponível. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWinnerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingleWinner} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Remover Vencedor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

