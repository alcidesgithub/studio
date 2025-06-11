
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_AWARD_TIERS, MOCK_STORES, MOCK_EVENT } from '@/lib/constants';
import type { AwardTier, Store } from '@/types';
import { Dice6, ListChecks, Trophy, Download, PlayCircle } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SweepstakeWinnerRecord {
  tierId: string;
  tierName: string;
  prizeName: string;
  storeId: string;
  storeName: string;
  drawnAt: Date;
}

const exportToCSV = (data: any[], filename: string) => {
  if (typeof window === "undefined") return;
  const header = Object.keys(data[0]).join(",");
  const csvRows = data.map(row =>
    Object.values(row).map(value => {
      const stringValue = String(value instanceof Date ? format(value, "yyyy-MM-dd HH:mm:ss", { locale: ptBR }) : value);
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

  const awardTiersWithStats = useMemo(() => {
    return MOCK_AWARD_TIERS.map(tier => {
      const winnersForThisTier = drawnWinners.filter(w => w.tierId === tier.id).sort((a,b) => a.drawnAt.getTime() - b.drawnAt.getTime());
      const remainingQuantity = tier.quantityAvailable - winnersForThisTier.length;
      
      const eligibleStoresForTier = MOCK_STORES.filter(store => {
        const meetsPositivationRequirement = (store.positivationsDetails?.length || 0) >= tier.positivacoesRequired;
        const hasNotWonThisTier = !winnersForThisTier.some(w => w.storeId === store.id); 
        return store.participating && meetsPositivationRequirement && hasNotWonThisTier;
      });

      return {
        ...tier,
        remainingQuantity,
        eligibleStores: eligibleStoresForTier,
        winners: winnersForThisTier, 
      };
    });
  }, [drawnWinners]); 

  const handleDrawWinner = async (tier: typeof awardTiersWithStats[0]) => {
    if (tier.remainingQuantity <= 0 || tier.eligibleStores.length === 0) {
      toast({ title: "Não é Possível Sortear", description: "Nenhum prêmio restante ou nenhuma loja elegível para esta faixa.", variant: "default" });
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
      storeName: winningStore.name,
      drawnAt: new Date(),
    };

    setDrawnWinners(prev => [...prev, newWinnerRecord]);
    setIsLoadingDraw(null);
    toast({
      title: "Vencedor Sorteado!",
      description: `${winningStore.name} ganhou o prêmio ${tier.rewardName} (da faixa ${tier.name}).`,
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
      Vencedor: r.storeName,
      SorteadoEm: format(r.drawnAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    }));
    exportToCSV(dataToExport, "log_vencedores_sorteio_faixas_hiperfarma");
    toast({ title: "Log Exportado", description: "O log de vencedores do sorteio foi exportado para um arquivo CSV." });
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Gerenciamento de Sorteios por Faixa"
        description={`Sorteie vencedores para cada faixa de premiação no ${MOCK_EVENT.name}.`}
        icon={Dice6}
        actions={
          <Button onClick={handleExportLog} variant="outline" disabled={drawnWinners.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar Log de Vencedores (CSV)
          </Button>
        }
      />

      {awardTiersWithStats.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma faixa de premiação configurada.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {awardTiersWithStats.map((tier) => (
          <Card key={tier.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="text-accent h-6 w-6" /> Faixa {tier.name}</CardTitle>
              <CardDescription>
                Tipo de Prêmio: <span className="font-semibold">{tier.rewardName}</span> <br />
                Requer: <span className="font-semibold">{tier.positivacoesRequired}</span> positivacões. <br />
                Total de Prêmios: <span className="font-semibold">{tier.quantityAvailable}</span> | Restantes: <span className="font-semibold">{tier.remainingQuantity}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1"><ListChecks /> Lojas Elegíveis ({tier.eligibleStores.length}):</h4>
                {tier.eligibleStores.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-24 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {tier.eligibleStores.map(store => <li key={store.id}>{store.name}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground p-2">Nenhuma loja elegível para o sorteio desta faixa (ou todas já ganharam, ou nenhuma atende aos critérios).</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-1">Slots de Prêmios para esta Faixa:</h4>
                {Array.from({ length: tier.quantityAvailable }).map((_, prizeIndex) => {
                  const winnerRecord = tier.winners[prizeIndex]; 
                  const isSlotDrawn = !!winnerRecord;
                  const canDrawForThisSlot = !isSlotDrawn && tier.eligibleStores.length > 0 && tier.remainingQuantity > 0;

                  return (
                    <div key={prizeIndex} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                      <div className="text-sm">
                        <span className="font-medium text-primary">{tier.rewardName} - Prêmio #{prizeIndex + 1}</span>
                        {isSlotDrawn && winnerRecord ? (
                          <p className="text-xs text-green-700 font-semibold">
                            Ganho por: {winnerRecord.storeName}
                            <span className="text-muted-foreground font-normal"> ({format(winnerRecord.drawnAt, "dd/MM HH:mm", { locale: ptBR })})</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Disponível para sorteio</p>
                        )}
                      </div>
                      {!isSlotDrawn && (
                        <Button
                          size="sm"
                          onClick={() => handleDrawWinner(tier)}
                          disabled={!canDrawForThisSlot || isLoadingDraw === tier.id}
                          variant={canDrawForThisSlot ? "default" : "outline"}
                          className="w-28"
                        >
                          {isLoadingDraw === tier.id ? (
                            <PlayCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <PlayCircle className="mr-2 h-4 w-4" />
                          )}
                          {isLoadingDraw === tier.id ? "Sorteando..." : "Sortear"}
                        </Button>
                      )}
                       {isSlotDrawn && (
                        <div className="w-28 text-right">
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

      <Card className="shadow-xl mt-8">
        <CardHeader>
          <CardTitle>Log de Vencedores do Sorteio</CardTitle>
          <CardDescription>Histórico de todos os vencedores sorteados em todas as faixas e slots de prêmios.</CardDescription>
        </CardHeader>
        <CardContent>
          {drawnWinners.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Loja Vencedora</TableHead>
                  <TableHead className="text-right">Sorteado Em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drawnWinners.sort((a,b) => b.drawnAt.getTime() - a.drawnAt.getTime()).map((record, index) => (
                  <TableRow key={`${record.tierId}-${record.storeId}-${index}`}>
                    <TableCell className="font-medium">{record.tierName}</TableCell>
                    <TableCell>{record.prizeName}</TableCell>
                    <TableCell className="font-semibold">{record.storeName}</TableCell>
                    <TableCell className="text-right text-xs">{format(record.drawnAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum vencedor sorteado ainda. Comece sorteando vencedores nos slots de prêmios acima.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
