
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
  // Simple CSV header generation from keys of the first object
  const header = Object.keys(data[0]).join(",");
  const csvRows = data.map(row => 
    Object.values(row).map(value => {
      const stringValue = String(value);
      // Escape commas and quotes
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


export default function AdminSweepstakesPage() {
  const [results, setResults] = useState<SweepstakeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRunSweepstakes = async () => {
    setIsLoading(true);
    // Simulate API call and random drawing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple mock: pick up to 3 random winners from eligible stores
    const eligibleStores = [...MOCK_SWEEPSTAKE_ENTRIES]; // Make a mutable copy
    const winners: SweepstakeResult[] = [];
    const prizes = ["Grand Prize: Smart TV 55\"", "Second Prize: Tablet Pro", "Third Prize: Premium Gift Basket"];

    if (eligibleStores.length === 0) {
        toast({
            title: "No Eligible Stores",
            description: "There are no stores currently qualifying for the sweepstakes.",
            variant: "default"
        });
        setIsLoading(false);
        return;
    }

    for (let i = 0; i < Math.min(prizes.length, MOCK_SWEEPSTAKE_ENTRIES.length); i++) {
      if(eligibleStores.length === 0) break; // No more stores to pick from
      const randomIndex = Math.floor(Math.random() * eligibleStores.length);
      const winner = eligibleStores.splice(randomIndex, 1)[0]; // Remove winner from list
      winners.push({ ...winner, prize: prizes[i] });
    }
    
    setResults(winners);
    setIsLoading(false);
    toast({
      title: "Sweepstakes Complete!",
      description: `${winners.length} winners selected. Check the results below.`,
    });
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast({ title: "No results to export", description: "Run a sweepstake first to generate results.", variant: "default"});
      return;
    }
    const dataToExport = results.map(r => ({
        storeName: r.storeName,
        prize: r.prize,
        qualificationRate: `${(r.qualificationRate * 100).toFixed(0)}%`
    }));
    exportToCSV(dataToExport, "hiperfarma_sweepstake_results");
    toast({ title: "Results Exported", description: "Sweepstake results have been exported to a CSV file." });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Sweepstakes Management"
        description="Perform random drawings for qualifying stores and export the results."
        icon={Gift}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRunSweepstakes} disabled={isLoading || MOCK_SWEEPSTAKE_ENTRIES.length === 0}>
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
            <CardDescription>Stores eligible for the sweepstakes based on their success rate.</CardDescription>
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
           <CardFooter className="text-xs text-muted-foreground">
            {MOCK_SWEEPSTAKE_ENTRIES.length > 0 ? 
              `A total of ${MOCK_SWEEPSTAKE_ENTRIES.length} stores are currently eligible.` :
              "Register stores and track their performance to make them eligible."
            }
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sweepstakes Results</CardTitle>
            <CardDescription>Winners from the latest drawing will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Prize Won</TableHead>
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
              <p className="text-muted-foreground text-center py-4">
                {isLoading ? "Running sweepstakes, please wait..." : "No sweepstakes run yet, or no winners from the last run."}
              </p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Sweepstakes results are logged for auditing purposes (mock implementation).
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
