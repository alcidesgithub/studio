
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_AWARD_TIERS, MOCK_STORES, MOCK_EVENT } from '@/lib/constants';
import type { AwardTier, Store } from '@/types';
import { Dice6, ListChecks, Trophy, Download, PlayCircle, Users, CheckCircle } from 'lucide-react';
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

// Mock function to simulate CSV export
const exportToCSV = (data: any[], filename: string) => {
  if (typeof window === "undefined") return;
  const header = Object.keys(data[0]).join(",");
  const csvRows = data.map(row =>
    Object.values(row).map(value => {
      const stringValue = String(value instanceof Date ? format(value, "yyyy-MM-dd HH:mm:ss") : value);
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
  const [isLoadingDraw, setIsLoadingDraw] = useState<string | null>(null); // tierId of loading draw
  const { toast } = useToast();

  const awardTiersWithStats = useMemo(() => {
    return MOCK_AWARD_TIERS.map(tier => {
      const winnersForThisTier = drawnWinners.filter(w => w.tierId === tier.id);
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
  }, [drawnWinners, MOCK_AWARD_TIERS, MOCK_STORES]);

  const handleDrawWinner = async (tier: typeof awardTiersWithStats[0]) => {
    if (tier.remainingQuantity <= 0 || tier.eligibleStores.length === 0) {
      toast({ title: "Cannot Draw", description: "No prizes remaining or no eligible stores for this tier.", variant: "default" });
      return;
    }

    setIsLoadingDraw(tier.id);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

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
      title: "Winner Drawn!",
      description: `${winningStore.name} won the ${tier.rewardName} for the ${tier.name} tier.`,
    });
  };

  const handleExportLog = () => {
    if (drawnWinners.length === 0) {
      toast({ title: "No winners to export", description: "Draw some winners first.", variant: "default" });
      return;
    }
    const dataToExport = drawnWinners.map(r => ({
      Tier: r.tierName,
      Prize: r.prizeName,
      Winner: r.storeName,
      DrawnAt: format(r.drawnAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    }));
    exportToCSV(dataToExport, "hiperfarma_tiered_sweepstake_winners_log");
    toast({ title: "Log Exported", description: "Sweepstake winners log has been exported to a CSV file." });
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Tiered Sweepstakes Management"
        description={`Draw winners for each award tier in ${MOCK_EVENT.name}.`}
        icon={Dice6}
        actions={
          <Button onClick={handleExportLog} variant="outline" disabled={drawnWinners.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export Winners Log (CSV)
          </Button>
        }
      />

      {awardTiersWithStats.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No award tiers configured.</CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {awardTiersWithStats.map((tier) => (
          <Card key={tier.id} className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="text-accent h-6 w-6" /> {tier.name} Tier</CardTitle>
              <CardDescription>
                Prize: <span className="font-semibold">{tier.rewardName}</span> <br />
                Requires: <span className="font-semibold">{tier.positivacoesRequired}</span> positivations. <br />
                Remaining Prizes: <span className="font-semibold">{tier.remainingQuantity}</span> of {tier.quantityAvailable}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><ListChecks /> Eligible Stores ({tier.eligibleStores.length}):</h4>
                {tier.eligibleStores.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {tier.eligibleStores.map(store => <li key={store.id}>{store.name}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No stores currently eligible for this draw.</p>
                )}
              </div>
              
              {tier.winners.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Users /> Winners for this Tier:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {tier.winners.map(winner => (
                      <li key={winner.storeId} className="font-medium">
                        {winner.storeName} ({format(winner.drawnAt, "dd/MM HH:mm", {locale: ptBR})})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleDrawWinner(tier)}
                disabled={tier.remainingQuantity <= 0 || tier.eligibleStores.length === 0 || isLoadingDraw === tier.id}
              >
                {isLoadingDraw === tier.id ? <PlayCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                {tier.remainingQuantity <= 0 ? "No Prizes Left" : 
                 tier.eligibleStores.length === 0 ? "No Eligible Stores" : 
                 isLoadingDraw === tier.id ? "Drawing..." : `Draw Winner (${tier.rewardName})`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Sweepstake Winners Log</CardTitle>
          <CardDescription>History of all winners drawn across tiers.</CardDescription>
        </CardHeader>
        <CardContent>
          {drawnWinners.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Winning Store</TableHead>
                  <TableHead className="text-right">Drawn At</TableHead>
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
            <p className="text-muted-foreground text-center py-4">No winners drawn yet. Start by drawing winners from the tiers above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

