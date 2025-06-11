
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // CardFooter removed as it's no longer used for the draw button
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_AWARD_TIERS, MOCK_STORES, MOCK_EVENT } from '@/lib/constants';
import type { AwardTier, Store } from '@/types';
import { Dice6, ListChecks, Trophy, Download, PlayCircle } from 'lucide-react'; // Users, CheckCircle removed as they might be less relevant now
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
      const winnersForThisTier = drawnWinners.filter(w => w.tierId === tier.id).sort((a,b) => a.drawnAt.getTime() - b.drawnAt.getTime());
      const remainingQuantity = tier.quantityAvailable - winnersForThisTier.length;
      
      const eligibleStoresForTier = MOCK_STORES.filter(store => {
        const meetsPositivationRequirement = (store.positivationsDetails?.length || 0) >= tier.positivacoesRequired;
        const hasNotWonThisTier = !winnersForThisTier.some(w => w.storeId === store.id); // Store can only win one prize per tier
        return store.participating && meetsPositivationRequirement && hasNotWonThisTier;
      });

      return {
        ...tier,
        remainingQuantity,
        eligibleStores: eligibleStoresForTier,
        winners: winnersForThisTier, // Array of winners for this tier, ordered by draw time
      };
    });
  }, [drawnWinners]); // MOCK_AWARD_TIERS and MOCK_STORES are constants, no need to include in deps if they don't change

  const handleDrawWinner = async (tier: typeof awardTiersWithStats[0]) => {
    // This function is called when a "Draw" button for a specific prize slot is clicked.
    // It draws for the *tier* generally, and the UI will place the winner in the next available slot.
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
      description: `${winningStore.name} won the ${tier.rewardName} (from ${tier.name} tier).`,
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
                Prize Type: <span className="font-semibold">{tier.rewardName}</span> <br />
                Requires: <span className="font-semibold">{tier.positivacoesRequired}</span> positivations. <br />
                Total Prizes: <span className="font-semibold">{tier.quantityAvailable}</span> | Remaining: <span className="font-semibold">{tier.remainingQuantity}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1"><ListChecks /> Eligible Stores ({tier.eligibleStores.length}):</h4>
                {tier.eligibleStores.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-24 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {tier.eligibleStores.map(store => <li key={store.id}>{store.name}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground p-2">No stores currently eligible for this tier's draw (either all eligible have won, or none meet criteria).</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-1">Prize Slots for this Tier:</h4>
                {Array.from({ length: tier.quantityAvailable }).map((_, prizeIndex) => {
                  const winnerRecord = tier.winners[prizeIndex]; // Get winner for this specific slot index
                  const isSlotDrawn = !!winnerRecord;
                  // A slot can be drawn if it's not already drawn AND there are eligible stores for the TIER AND there are prizes remaining for the TIER
                  const canDrawForThisSlot = !isSlotDrawn && tier.eligibleStores.length > 0 && tier.remainingQuantity > 0;

                  return (
                    <div key={prizeIndex} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                      <div className="text-sm">
                        <span className="font-medium text-primary">{tier.rewardName} - Prize #{prizeIndex + 1}</span>
                        {isSlotDrawn && winnerRecord ? (
                          <p className="text-xs text-green-700 font-semibold">
                            Won by: {winnerRecord.storeName}
                            <span className="text-muted-foreground font-normal"> ({format(winnerRecord.drawnAt, "dd/MM HH:mm", { locale: ptBR })})</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Available to be drawn</p>
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
                          {isLoadingDraw === tier.id ? "Drawing..." : "Draw"}
                        </Button>
                      )}
                       {isSlotDrawn && (
                        <div className="w-28 text-right">
                            <span className="text-xs text-green-600 font-bold">AWARDED</span>
                        </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
            {/* CardFooter is removed as draw buttons are now inline with prize slots */}
          </Card>
        ))}
      </div>

      <Card className="shadow-xl mt-8">
        <CardHeader>
          <CardTitle>Sweepstake Winners Log</CardTitle>
          <CardDescription>History of all winners drawn across tiers and prize slots.</CardDescription>
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
            <p className="text-muted-foreground text-center py-4">No winners drawn yet. Start by drawing winners from the prize slots above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

