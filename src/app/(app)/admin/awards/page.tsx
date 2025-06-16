
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loadAwardTiers, saveAwardTiers } from '@/lib/localStorageUtils';
import type { AwardTier } from '@/types';
import { Trophy, PlusCircle, Edit, Trash2, Save, ArrowUp, ArrowDown, Eye, Loader2 } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
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

// Helper function para reatribuir sortOrder e garantir que são sequenciais
const reassignSortOrders = (tiersArray: AwardTier[]): AwardTier[] => {
  return tiersArray.map((tier, index) => ({ ...tier, sortOrder: index }));
};

interface AwardTierFormDialogContentProps {
  form: UseFormReturn<AwardTierFormValues>;
  onSubmit: (data: AwardTierFormValues) => void;
  editingTier: AwardTier | null;
  viewingTier: AwardTier | null;
  isSubmitting: boolean;
}

const AwardTierFormDialogContentInternal = ({ form, onSubmit, editingTier, viewingTier, isSubmitting }: AwardTierFormDialogContentProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>
            {editingTier ? 'Editar Faixa de Premiação' : 
            (viewingTier ? 'Visualizar Faixa de Premiação' : 'Adicionar Nova Faixa de Premiação')}
        </DialogTitle>
        <DialogDescription>
          {editingTier ? 'Atualize os detalhes desta faixa de premiação.' : 
          (viewingTier ? 'Detalhes da faixa de premiação.' : 'Preencha os detalhes para a nova faixa de premiação.')}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Faixa</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Bronze, Prata, Ouro" {...field} disabled={!!viewingTier} />
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
                  <Input placeholder="Ex: Cartão Presente R$100, Tablet XYZ" {...field} disabled={!!viewingTier} />
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
                  <Input type="number" placeholder="Ex: 10" {...field} disabled={!!viewingTier} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
                control={form.control}
                name="positivacoesRequiredPR"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Positivações Req. (PR)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="Ex: 5" {...field} disabled={!!viewingTier} />
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
                    <Input type="number" placeholder="Ex: 5" {...field} disabled={!!viewingTier} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
          <DialogFooter className="pt-3 sm:pt-4">
             <DialogClose asChild>
               <Button type="button" variant="outline">
                    {viewingTier ? 'Fechar' : 'Cancelar'}
               </Button>
            </DialogClose>
            {!viewingTier && (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                     {editingTier ? 'Salvar Alterações' : 'Criar Faixa'}
                </Button>
            )}
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

const DynamicAwardTierFormDialogContent = dynamic(() => Promise.resolve(AwardTierFormDialogContentInternal), {
  ssr: false,
  loading: () => <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> <p className="mt-2">Carregando formulário...</p></div>,
});


export default function AdminAwardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AwardTier | null>(null);
  const [viewingTier, setViewingTier] = useState<AwardTier | null>(null);
  const [tiers, setTiers] = useState<AwardTier[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let loadedTiers = loadAwardTiers();
    const tiersNeedSortOrderInitialization = loadedTiers.some(t => typeof t.sortOrder !== 'number' || isNaN(t.sortOrder));

    if (tiersNeedSortOrderInitialization) {
      loadedTiers.sort((a,b) => (a.positivacoesRequired.PR ?? Infinity) - (b.positivacoesRequired.PR ?? Infinity));
      loadedTiers = loadedTiers.map((tier, index) => ({ ...tier, sortOrder: index }));
      saveAwardTiers(loadedTiers);
    } else {
      loadedTiers.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
    }
    setTiers(loadedTiers);
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
    setViewingTier(null);
    form.reset({
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequiredPR: 1,
      positivacoesRequiredSC: 1,
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleEdit = (tier: AwardTier) => {
    setEditingTier(tier);
    setViewingTier(null);
    form.reset({
      name: tier.name,
      rewardName: tier.rewardName,
      quantityAvailable: tier.quantityAvailable,
      positivacoesRequiredPR: tier.positivacoesRequired.PR,
      positivacoesRequiredSC: tier.positivacoesRequired.SC,
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleView = (tier: AwardTier) => {
    setViewingTier(tier);
    setEditingTier(null);
    form.reset({ // Reset with viewingTier data to ensure form is populated for viewing
      name: tier.name,
      rewardName: tier.rewardName,
      quantityAvailable: tier.quantityAvailable,
      positivacoesRequiredPR: tier.positivacoesRequired.PR,
      positivacoesRequiredSC: tier.positivacoesRequired.SC,
    });
    setIsViewDialogOpen(true);
    setIsDialogOpen(false);
  };

  const handleDelete = (tierId: string) => {
    let updatedTiers = tiers.filter(t => t.id !== tierId);
    updatedTiers = reassignSortOrders(updatedTiers);
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
        t.id === editingTier.id ? { ...editingTier, ...tierDataToSave, sortOrder: editingTier.sortOrder } : t
      );
      toast({
        title: "Faixa Atualizada!",
        description: `A faixa de premiação "${data.name}" foi atualizada no armazenamento local.`,
      });
    } else {
      const newTier: AwardTier = { 
        id: `tier_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, 
        ...tierDataToSave,
        sortOrder: tiers.length 
      };
      updatedTiers = [...tiers, newTier];
      toast({
        title: "Faixa Criada!",
        description: `A faixa de premiação "${data.name}" foi criada no armazenamento local.`,
      });
    }
    updatedTiers.sort((a,b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));
    updatedTiers = reassignSortOrders(updatedTiers);
    
    setTiers(updatedTiers);
    saveAwardTiers(updatedTiers);
    form.reset();
    setIsDialogOpen(false);
    setEditingTier(null);
  };

  const moveTier = (tierId: string, direction: 'up' | 'down') => {
    const currentIndex = tiers.findIndex(t => t.id === tierId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= tiers.length) return;

    const newTiersArray = [...tiers];
    const [movedTier] = newTiersArray.splice(currentIndex, 1);
    newTiersArray.splice(newIndex, 0, movedTier);

    const finalTiers = reassignSortOrders(newTiersArray);
    setTiers(finalTiers);
    saveAwardTiers(finalTiers);
  };


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Faixas de premiação"
        description="Defina e gerencie as faixas de premiação. Use as setas para reordenar."
        icon={Trophy}
        iconClassName="text-secondary"
        actions={
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Faixa
          </Button>
        }
      />

      <Dialog 
        open={isDialogOpen || isViewDialogOpen} 
        onOpenChange={(openState) => {
            if (!openState) {
                setIsDialogOpen(false);
                setIsViewDialogOpen(false);
                setEditingTier(null);
                setViewingTier(null);
                form.reset();
            }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          {(isDialogOpen || isViewDialogOpen) && (
             <DynamicAwardTierFormDialogContent
                form={form}
                onSubmit={onSubmit}
                editingTier={editingTier}
                viewingTier={viewingTier}
                isSubmitting={form.formState.isSubmitting}
             />
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader className="px-4 py-5 sm:p-6">
          <CardTitle>Faixas de Premiação Configurada</CardTitle>
          <CardDescription>Lista das faixas de premiação atuais e seus critérios por estado. A ordem aqui será refletida na tela de sorteios.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ordem</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Nome da Faixa</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Prêmio</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Quantidade</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Positivações PR</TableHead>
                  <TableHead className="hidden sm:table-cell text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Positivações SC</TableHead>
                  <TableHead className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier, index) => (
                  <TableRow key={tier.id}>
                    <TableCell className="w-20 sm:w-24 px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => moveTier(tier.id, 'up')} disabled={index === 0}>
                          <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="sr-only">Mover para Cima</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => moveTier(tier.id, 'down')} disabled={index === tiers.length - 1}>
                          <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="sr-only">Mover para Baixo</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{tier.name}</TableCell>
                    <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 break-words">{tier.rewardName}</TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{tier.quantityAvailable}</TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{tier.positivacoesRequired.PR}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{tier.positivacoesRequired.SC}</TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                      <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleView(tier)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Visualizar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(tier)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(tier.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {tiers.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">Nenhuma faixa de premiação configurada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

