
"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MOCK_AWARD_TIERS } from '@/lib/constants';
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
  positivacoesRequired: z.coerce.number().int().positive({ message: "Positivações necessárias devem ser um número positivo." }),
});

type AwardTierFormValues = z.infer<typeof awardTierSchema>;

let currentMockTiers: AwardTier[] = [...MOCK_AWARD_TIERS];


export default function AdminAwardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AwardTier | null>(null);
  const [tiers, setTiers] = useState<AwardTier[]>(currentMockTiers); 
  const { toast } = useToast();

  const form = useForm<AwardTierFormValues>({
    resolver: zodResolver(awardTierSchema),
    defaultValues: {
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequired: 1,
    },
  });

  const handleAddNew = () => {
    setEditingTier(null);
    form.reset({
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequired: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tier: AwardTier) => {
    setEditingTier(tier);
    form.reset({
      name: tier.name,
      rewardName: tier.rewardName,
      quantityAvailable: tier.quantityAvailable,
      positivacoesRequired: tier.positivacoesRequired,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (tierId: string) => {
    currentMockTiers = currentMockTiers.filter(t => t.id !== tierId);
    setTiers(currentMockTiers);
    toast({
      title: "Faixa Excluída",
      description: "A faixa de premiação foi (simuladamente) excluída.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: AwardTierFormValues) => {
    if (editingTier) {
      currentMockTiers = currentMockTiers.map(t => 
        t.id === editingTier.id ? { ...editingTier, ...data } : t
      );
      setTiers(currentMockTiers);
      toast({
        title: "Faixa Atualizada!",
        description: `A faixa de premiação "${data.name}" foi (simuladamente) atualizada.`,
      });
    } else {
      const newTier: AwardTier = { id: `tier_${Date.now()}`, ...data };
      currentMockTiers = [...currentMockTiers, newTier];
      setTiers(currentMockTiers);
      toast({
        title: "Faixa Criada!",
        description: `A faixa de premiação "${data.name}" foi (simuladamente) criada.`,
      });
    }
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
        <DialogTrigger asChild /> 
        <DialogContent className="sm:max-w-[480px]">
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
              <FormField
                control={form.control}
                name="positivacoesRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Positivações Necessárias</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                 <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => { setEditingTier(null); form.reset();}}>Cancelar</Button>
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
          <CardDescription>Lista das faixas de premiação atuais e seus critérios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Faixa</TableHead>
                <TableHead>Prêmio</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Positivações Req.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.sort((a,b) => a.positivacoesRequired - b.positivacoesRequired).map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.rewardName}</TableCell>
                  <TableCell className="text-right">{tier.quantityAvailable}</TableCell>
                  <TableCell className="text-right">{tier.positivacoesRequired}</TableCell>
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
