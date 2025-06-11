
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger from here
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Save, UserPlus, Edit, Trash2, PlusCircle, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadVendors, saveVendors, loadSalespeople, saveSalespeople } from '@/lib/localStorageUtils';
import type { Vendor, Salesperson } from '@/types';
import Image from 'next/image';

const vendorSchema = z.object({
  name: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres."),
  cnpj: z.string().refine(value => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 14;
  }, { message: "CNPJ deve ter 14 dígitos (após remover formatação)." }),
  address: z.string().min(5, "Endereço é obrigatório."),
  city: z.string().min(2, "Cidade é obrigatória."),
  neighborhood: z.string().min(2, "Bairro é obrigatório."),
  state: z.string().min(2, "Estado é obrigatório."),
  logoUrl: z.string().url("Deve ser uma URL válida para o logo."),
  dataAiHint: z.string().optional().describe("Dica para IA sobre o logo (ex: company logo)"),
});
type VendorFormValues = z.infer<typeof vendorSchema>;

const salespersonSchema = z.object({
  name: z.string().min(3, "Nome do vendedor é obrigatório."),
  phone: z.string().min(10, "Telefone é obrigatório."),
  email: z.string().email("Endereço de email inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});
type SalespersonFormValues = z.infer<typeof salespersonSchema>;

const formatCNPJ = (cnpj: string = '') => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj; // Return as is if not 14 digits after cleaning
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export default function ManageVendorsPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);

  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const [isSalespersonDialogOpen, setIsSalespersonDialogOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [currentVendorIdForSalesperson, setCurrentVendorIdForSalesperson] = useState<string | null>(null);
  const [salespersonToDelete, setSalespersonToDelete] = useState<Salesperson | null>(null);

  useEffect(() => {
    setVendors(loadVendors());
    setSalespeople(loadSalespeople());
  }, []);

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '', cnpj: '', address: '', city: '', neighborhood: '', state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=Logo', dataAiHint: 'company logo',
    },
  });

  const salespersonForm = useForm<SalespersonFormValues>({
    resolver: zodResolver(salespersonSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  });

  const handleAddNewVendor = () => {
    setEditingVendor(null);
    vendorForm.reset({
      name: '', cnpj: '', address: '', city: '', neighborhood: '', state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=NovoLogo', dataAiHint: 'company logo',
    });
    setIsVendorDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    vendorForm.reset({
      name: vendor.name,
      cnpj: formatCNPJ(vendor.cnpj),
      address: vendor.address,
      city: vendor.city,
      neighborhood: vendor.neighborhood,
      state: vendor.state,
      logoUrl: vendor.logoUrl,
      dataAiHint: vendor.dataAiHint || 'company logo',
    });
    setIsVendorDialogOpen(true);
  };

  const confirmDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
  };

  const handleDeleteVendor = () => {
    if (!vendorToDelete) return;

    // Remove associated salespeople first
    const updatedSalespeople = salespeople.filter(sp => sp.vendorId !== vendorToDelete.id);
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);

    // Then remove the vendor
    const updatedVendors = vendors.filter(v => v.id !== vendorToDelete.id);
    setVendors(updatedVendors);
    saveVendors(updatedVendors);

    toast({
      title: "Fornecedor Excluído!",
      description: `O fornecedor "${vendorToDelete.name}" e seus vendedores vinculados foram removidos.`,
      variant: "destructive"
    });
    setVendorToDelete(null); // Close confirmation dialog
  };

  const onVendorSubmit = (data: VendorFormValues) => {
    let updatedVendors;
    const rawCnpj = data.cnpj.replace(/\D/g, '');

    if (editingVendor) {
      updatedVendors = vendors.map(v =>
        v.id === editingVendor.id ? { ...editingVendor, ...data, cnpj: rawCnpj, dataAiHint: data.dataAiHint || 'company logo' } : v
      );
      toast({ title: "Fornecedor Atualizado!", description: `${data.name} foi atualizado.` });
    } else {
      const newVendorId = `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
      const newVendor: Vendor = {
        id: newVendorId,
        ...data,
        cnpj: rawCnpj,
        dataAiHint: data.dataAiHint || 'company logo',
      };
      updatedVendors = [...vendors, newVendor];
      setEditingVendor(newVendor); // Keep dialog open with new vendor data for salesperson addition
      toast({ title: "Fornecedor Cadastrado!", description: `${data.name} foi cadastrado. Você pode adicionar vendedores agora.` });
    }
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    
    if (!editingVendor) { // If it was a new vendor, don't close dialog, allow adding salespeople
        // The dialog stays open because setEditingVendor was called.
    } else { // If editing an existing vendor, close dialog
        vendorForm.reset();
        setIsVendorDialogOpen(false);
        setEditingVendor(null);
    }
  };

  const handleAddNewSalesperson = (vendorId: string) => {
    setCurrentVendorIdForSalesperson(vendorId);
    setEditingSalesperson(null);
    salespersonForm.reset({ name: '', phone: '', email: '', password: '' });
    setIsSalespersonDialogOpen(true);
  };

  const handleEditSalesperson = (salesperson: Salesperson) => {
    setCurrentVendorIdForSalesperson(salesperson.vendorId);
    setEditingSalesperson(salesperson);
    salespersonForm.reset({
      name: salesperson.name,
      phone: salesperson.phone,
      email: salesperson.email,
      password: '', // Do not pre-fill password for editing
    });
    setIsSalespersonDialogOpen(true);
  };

  const confirmDeleteSalesperson = (salesperson: Salesperson) => {
    setSalespersonToDelete(salesperson);
  };

  const handleDeleteSalesperson = () => {
    if (!salespersonToDelete) return;
    const updatedSalespeople = salespeople.filter(sp => sp.id !== salespersonToDelete.id);
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);
    toast({
        title: "Vendedor Excluído!",
        description: `O vendedor "${salespersonToDelete.name}" foi removido.`,
        variant: "destructive"
    });
    setSalespersonToDelete(null); // Close confirmation dialog
  };

  const onSalespersonSubmit = (data: SalespersonFormValues) => {
    if (!currentVendorIdForSalesperson) {
        toast({ title: "Erro", description: "ID do Fornecedor não encontrado.", variant: "destructive" });
        return;
    }
    let updatedSalespeople;
    const vendorForSalesperson = vendors.find(v => v.id === currentVendorIdForSalesperson);

    if (editingSalesperson) {
        updatedSalespeople = salespeople.map(sp =>
            sp.id === editingSalesperson.id ? { ...editingSalesperson, ...data, vendorId: currentVendorIdForSalesperson } : sp
        );
        toast({ title: "Vendedor Atualizado!", description: `${data.name} atualizado para ${vendorForSalesperson?.name}.` });
    } else {
        const newSalesperson: Salesperson = {
            id: `sp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            ...data,
            vendorId: currentVendorIdForSalesperson
        };
        updatedSalespeople = [...salespeople, newSalesperson];
        toast({ title: "Vendedor Cadastrado!", description: `${data.name} cadastrado para ${vendorForSalesperson?.name}.` });
    }
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);
    salespersonForm.reset();
    setIsSalespersonDialogOpen(false);
    setEditingSalesperson(null);
    // currentVendorIdForSalesperson remains as the vendor dialog is still open
  };

  const salespeopleForCurrentEditingVendor = useMemo(() => {
    if (!editingVendor) return [];
    return salespeople.filter(sp => sp.vendorId === editingVendor.id);
  }, [salespeople, editingVendor]);

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Fornecedores"
        description="Adicione, edite ou remova fornecedores e gerencie seus vendedores."
        icon={Briefcase}
        actions={
          <Button onClick={handleAddNewVendor}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Fornecedor
          </Button>
        }
      />

      <Dialog open={isVendorDialogOpen} onOpenChange={(isOpen) => {
          setIsVendorDialogOpen(isOpen);
          if (!isOpen) {
            setEditingVendor(null); // Reset editing state when dialog closes
            vendorForm.reset();
          }
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
            <DialogDescription>{editingVendor ? 'Atualize os detalhes deste fornecedor e gerencie seus vendedores.' : 'Preencha os detalhes para o novo fornecedor.'}</DialogDescription>
          </DialogHeader>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader><CardTitle className="text-xl">Informações do Fornecedor</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={vendorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Ex: Soluções Farmacêuticas Ltda." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ? formatCNPJ(field.value) : ''} onChange={e => field.onChange(formatCNPJ(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Ex: Rua das Indústrias, 789" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Ex: São Paulo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Pinheiros" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl><SelectContent>{STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input type="url" placeholder="https://example.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Logo)</FormLabel><FormControl><Input placeholder="Ex: company logo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              {editingVendor && ( // Show salespeople section only when editing an existing vendor
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2"><Users /> Vendedores Associados</CardTitle>
                        <CardDescription>Gerencie os vendedores deste fornecedor.</CardDescription>
                    </div>
                    <Button type="button" size="sm" onClick={() => handleAddNewSalesperson(editingVendor.id)}>
                      <UserPlus className="mr-2 h-4 w-4" /> Adicionar Vendedor
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {salespeopleForCurrentEditingVendor.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salespeopleForCurrentEditingVendor.map(sp => (
                            <TableRow key={sp.id}>
                              <TableCell>{sp.name}</TableCell>
                              <TableCell>{sp.email}</TableCell>
                              <TableCell>{sp.phone}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEditSalesperson(sp)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => confirmDeleteSalesperson(sp)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum vendedor cadastrado para este fornecedor.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setIsVendorDialogOpen(false); setEditingVendor(null); vendorForm.reset();}}>Fechar</Button></DialogClose>
                <Button type="submit" disabled={vendorForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingVendor ? 'Salvar Alterações no Fornecedor' : 'Cadastrar Fornecedor'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSalespersonDialogOpen} onOpenChange={(isOpen) => {
          setIsSalespersonDialogOpen(isOpen);
          if (!isOpen) {
              setEditingSalesperson(null);
              // Do not reset currentVendorIdForSalesperson as the main vendor dialog might still be open
              salespersonForm.reset();
          }
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingSalesperson ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
                <DialogDescription>
                    {editingSalesperson ? `Atualize os dados de ${editingSalesperson.name}.` : `Adicione um novo vendedor para ${vendors.find(v => v.id === currentVendorIdForSalesperson)?.name || 'este fornecedor'}.`}
                </DialogDescription>
            </DialogHeader>
            <Form {...salespersonForm}>
                <form onSubmit={salespersonForm.handleSubmit(onSalespersonSubmit)} className="space-y-4 py-4">
                    <FormField control={salespersonForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Vendedor(a)</FormLabel><FormControl><Input placeholder="Ex: Ana Beatriz" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="vendas.login@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha de Login {editingSalesperson ? '(Deixe em branco para não alterar)' : ''}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={salespersonForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingSalesperson ? 'Salvar Alterações' : 'Cadastrar Vendedor'}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{vendorToDelete?.name}"? Esta ação também removerá todos os vendedores vinculados a ele e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVendorToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVendor} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir Fornecedor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!salespersonToDelete} onOpenChange={(open) => !open && setSalespersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Vendedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o vendedor "{salespersonToDelete?.name}"? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSalespersonToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSalesperson} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir Vendedor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
          <CardDescription>Lista de todos os fornecedores no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Nome da Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Vendedores</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhum fornecedor cadastrado.</TableCell></TableRow>
              )}
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Image src={vendor.logoUrl} alt={`Logo ${vendor.name}`} width={60} height={30} className="object-contain rounded" data-ai-hint={vendor.dataAiHint || "company logo"} />
                  </TableCell>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{formatCNPJ(vendor.cnpj)}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>{salespeople.filter(sp => sp.vendorId === vendor.id).length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEditVendor(vendor)}>
                      <Edit className="h-4 w-4" /><span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => confirmDeleteVendor(vendor)}>
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    