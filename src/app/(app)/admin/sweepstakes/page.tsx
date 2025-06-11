"use client"; // For onClick handlers

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_SWEEPSTAKE_ENTRIES } from '@/lib/constants';
import type { SweepstakeResult } from '@/types';
import { Gift, ListChecks, Download, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Mock function to simulate CSV export
const exportToCSV = (data: any[], filename: string) => {
  if (typeof window === "undefined") return;
  const csvContent = "data:text/csv;charset=utf-8," + 
    [Object.keys(data[0]).join(","), ...data.map(item => Object.values(item).join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export default function AdminSweepstakesPage() {
  const [results, setResults] = useState<SweepstakeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRunSweepstakes = async () => {
    setIsLoading(true);
    // Simulate API call and random drawing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple mock: pick 3 random winners from eligible stores
    const eligibleStores = [...MOCK_SWEEPSTAKE_ENTRIES];
    const winners: SweepstakeResult[] = [];
    const prizes = ["Grand Prize: Smart TV", "Second Prize: Tablet", "Third Prize: Gift Basket"];

    for (let i = 0; i < Math.min(prizes.length, eligibleStores.length); i++) {
      const randomIndex = Math.floor(Math.random() * eligibleStores.length);
      const winner = eligibleStores.splice(randomIndex, 1)[0];
      winners.push({ ...winner, prize: prizes[i] });
    }
    
    setResults(winners);
    setIsLoading(false);
    toast({
      title: "Sweepstakes Complete!",
      description: `${winners.length} winners selected.`,
    });
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast({ title: "No results to export", variant: "destructive"});
      return;
    }
    exportToCSV(results, "sweepstake_results");
    toast({ title: "Results exported to CSV" });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Sweepstakes Management"
        description="Perform random drawings and manage results."
        icon={Gift}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleRunSweepstakes} disabled={isLoading}>
              <PlayCircle className="mr-2 h-4 w-4" /> {isLoading ? "Running..." : "Run Sweepstakes"}
            </Button>
            <Button onClick={handleExportResults} variant="outline" disabled={results.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Results (CSV)
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks /> Qualifying Stores</CardTitle>
            <CardDescription>Stores eligible for the current sweepstakes based on success rate.</CardDescription>
          </CardHeader>
          <CardContent>
            {MOCK_SWEEPSTAKE_ENTRIES.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_SWEEPSTAKE_ENTRIES.map((entry) => (
                    <TableRow key={entry.storeId}>
                      <TableCell className="font-medium">{entry.storeName}</TableCell>
                      <TableCell className="text-right">{(entry.qualificationRate * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No stores currently qualify for sweepstakes.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sweepstakes Results</CardTitle>
            <CardDescription>Winners from the latest drawing.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Prize</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.storeId}>
                      <TableCell className="font-medium">{result.storeName}</TableCell>
                      <TableCell>{result.prize}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No sweepstakes run yet, or no winners.</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Sweepstakes results are logged for auditing purposes (mock).
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Add metadata if server rendering, but this is a client component
// export const metadata: Metadata = {
//   title: 'Sweepstakes - Hiperfarma Business Meeting Manager',
// };
