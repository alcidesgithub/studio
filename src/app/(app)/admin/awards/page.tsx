
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loadAwardTiers, saveAwardTiers } from '@/lib/localStorageUtils';
import type { AwardTier } from '@/types';
import { Trophy, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const awardTierSchema = z.object({
  name: z.string().min(3, { message: "Nome da faixa deve ter pelo menos 3 caracteres." }),
  rewardName: z.string().min(3, { message: "Nome do prêmio deve ter pelo menos 3 caracteres." }),
  quantityAvailable: z.coerce.number().int().positive({ message: "Quantidade deve ser um número positivo." }),
  positivacoesRequiredPR: z.coerce.number().int().min(1, { message: "Positivações para PR devem ser pelo menos 1." }),
  positivacoesRequiredSC: z.coerce.number().int().min(1, { message: "Positivações para SC devem ser pelo menos 1." }),
});

type AwardTierFormValues = z.infer<typeof awardTierSchema>;

export default function AdminAwardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AwardTier | null>(null);
  const [tiers, setTiers] = useState<AwardTier[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setTiers(loadAwardTiers());
  }, []);

  const form = useForm<AwardTierFormValues>({
    resolver: zodResolver(awardTierSchema),
    defaultValues: {
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequiredPR: 1,
      positivacoesRequiredSC: 1,
    },
  });

  const handleAddNew = () => {
    setEditingTier(null);
    form.reset({
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequiredPR: 1,
      positivacoesRequiredSC: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tier: AwardTier) => {
    setEditingTier(tier);
    form.reset({
      name: tier.name,
      rewardName: tier.rewardName,
      quantityAvailable: tier.quantityAvailable,
      positivacoesRequiredPR: tier.positivacoesRequired.PR,
      positivacoesRequiredSC: tier.positivacoesRequired.SC,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (tierId: string) => {
    const updatedTiers = tiers.filter(t => t.id !== tierId);
    setTiers(updatedTiers);
    saveAwardTiers(updatedTiers);
    toast({
      title: "Faixa Excluída",
      description: "A faixa de premiação foi excluída do armazenamento local.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: AwardTierFormValues) => {
    let updatedTiers;
    const tierDataToSave = {
        name: data.name,
        rewardName: data.rewardName,
        quantityAvailable: data.quantityAvailable,
        positivacoesRequired: {
            PR: data.positivacoesRequiredPR,
            SC: data.positivacoesRequiredSC,
        }
    };

    if (editingTier) {
      updatedTiers = tiers.map(t =>
        t.id === editingTier.id ? { ...editingTier, ...tierDataToSave } : t
      );
      toast({
        title: "Faixa Atualizada!",
        description: `A faixa de premiação "${data.name}" foi atualizada no armazenamento local.`,
      });
    } else {
      const newTier: AwardTier = { id: `tier_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, ...tierDataToSave };
      updatedTiers = [...tiers, newTier];
      toast({
        title: "Faixa Criada!",
        description: `A faixa de premiação "${data.name}" foi criada no armazenamento local.`,
      });
    }
    setTiers(updatedTiers);
    saveAwardTiers(updatedTiers);
    form.reset();
    setIsDialogOpen(false);
    setEditingTier(null);
  };


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento de Faixas de Premiação"
        description="Defina e gerencie as faixas de premiação para performance das lojas."
        icon={Trophy}
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Faixa
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Editar Faixa de Premiação' : 'Adicionar Nova Faixa de Premiação'}</DialogTitle>
            <DialogDescription>
              {editingTier ? 'Atualize os detalhes desta faixa de premiação.' : 'Preencha os detalhes para a nova faixa de premiação.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Faixa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bronze, Prata, Ouro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rewardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Descrição do Prêmio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cartão Presente R$100, Tablet XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantityAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Disponível</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="positivacoesRequiredPR"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Positivações Req. (PR)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Ex: 5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="positivacoesRequiredSC"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Positivações Req. (SC)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="Ex: 5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <DialogFooter className="pt-4">
                 <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => { setEditingTier(null); form.reset(); setIsDialogOpen(false);}}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   <Save className="mr-2 h-4 w-4" /> {editingTier ? 'Salvar Alterações' : 'Criar Faixa'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Faixas de Premiação Configurada</CardTitle>
          <CardDescription>Lista das faixas de premiação atuais e seus critérios por estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Faixa</TableHead>
                <TableHead>Prêmio</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Positivações PR</TableHead>
                <TableHead className="text-right">Positivações SC</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.sort((a,b) => a.positivacoesRequired.PR - b.positivacoesRequired.PR).map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.rewardName}</TableCell>
                  <TableCell className="text-right">{tier.quantityAvailable}</TableCell>
                  <TableCell className="text-right">{tier.positivacoesRequired.PR}</TableCell>
                  <TableCell className="text-right">{tier.positivacoesRequired.SC}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEdit(tier)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(tier.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {tiers.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">Nenhuma faixa de premiação configurada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
