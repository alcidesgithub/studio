
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_SWEEPSTAKE_ENTRIES } from '@/lib/constants';
import type { SweepstakeResult } from '@/types';
import { Gift, ListChecks, Download, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const exportToCSV = (data: any[], filename: string) => {
  if (typeof window === "undefined") return;
  const header = Object.keys(data[0]).join(",");
  const csvRows = data.map(row => 
    Object.values(row).map(value => {
      const stringValue = String(value);
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const eligibleStores = [...MOCK_SWEEPSTAKE_ENTRIES]; 
    const winners: SweepstakeResult[] = [];
    const prizes = ["Grande Prêmio: Smart TV 55\"", "Segundo Prêmio: Tablet Pro", "Terceiro Prêmio: Cesta de Presentes Premium"];

    if (eligibleStores.length === 0) {
        toast({
            title: "Nenhuma Loja Elegível",
            description: "Não há lojas qualificadas para o sorteio no momento.",
            variant: "default"
        });
        setIsLoading(false);
        return;
    }

    for (let i = 0; i < Math.min(prizes.length, MOCK_SWEEPSTAKE_ENTRIES.length); i++) {
      if(eligibleStores.length === 0) break; 
      const randomIndex = Math.floor(Math.random() * eligibleStores.length);
      const winner = eligibleStores.splice(randomIndex, 1)[0]; 
      winners.push({ ...winner, prize: prizes[i] });
    }
    
    setResults(winners);
    setIsLoading(false);
    toast({
      title: "Sorteio Concluído!",
      description: `${winners.length} vencedores selecionados. Verifique os resultados abaixo.`,
    });
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast({ title: "Nenhum resultado para exportar", description: "Realize um sorteio primeiro para gerar resultados.", variant: "default"});
      return;
    }
    const dataToExport = results.map(r => ({
        NomeLoja: r.storeName,
        Premio: r.prize,
        TaxaQualificacao: `${(r.qualificationRate * 100).toFixed(0)}%`
    }));
    exportToCSV(dataToExport, "resultados_sorteio_hiperfarma");
    toast({ title: "Resultados Exportados", description: "Os resultados do sorteio foram exportados para um arquivo CSV." });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento de Sorteios"
        description="Realize sorteios aleatórios para lojas qualificadas e exporte os resultados."
        icon={Gift}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleRunSweepstakes} disabled={isLoading || MOCK_SWEEPSTAKE_ENTRIES.length === 0}>
              <PlayCircle className="mr-2 h-4 w-4" /> {isLoading ? "Sorteando..." : "Realizar Sorteio"}
            </Button>
            <Button onClick={handleExportResults} variant="outline" disabled={results.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Exportar Resultados (CSV)
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks /> Lojas Qualificadas</CardTitle>
            <CardDescription>Lojas elegíveis para o sorteio com base na taxa de sucesso.</CardDescription>
          </CardHeader>
          <CardContent>
            {MOCK_SWEEPSTAKE_ENTRIES.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Loja</TableHead>
                    <TableHead className="text-right">Taxa de Sucesso</TableHead>
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
              <p className="text-muted-foreground text-center py-4">Nenhuma loja se qualifica para o sorteio no momento.</p>
            )}
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
            {MOCK_SWEEPSTAKE_ENTRIES.length > 0 ? 
              `Um total de ${MOCK_SWEEPSTAKE_ENTRIES.length} lojas estão atualmente elegíveis.` :
              "Cadastre lojas e acompanhe seu desempenho para torná-las elegíveis."
            }
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Resultados do Sorteio</CardTitle>
            <CardDescription>Os vencedores do último sorteio aparecerão aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Loja</TableHead>
                    <TableHead>Prêmio Ganho</TableHead>
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
                {isLoading ? "Realizando sorteio, por favor aguarde..." : "Nenhum sorteio realizado ainda, ou nenhum vencedor no último sorteio."}
              </p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Os resultados dos sorteios são registrados para fins de auditoria (implementação de simulação).
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
