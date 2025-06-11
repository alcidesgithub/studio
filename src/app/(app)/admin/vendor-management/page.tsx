
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Save, UserPlus, Edit, Trash2, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadVendors, saveVendors, loadSalespeople, saveSalespeople } from '@/lib/localStorageUtils';
import type { Vendor, Salesperson } from '@/types';
import Image from 'next/image';

const vendorSchema = z.object({
  name: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres."),
  cnpj: z.string().length(14, "CNPJ deve ter 14 dígitos (somente números).").or(z.string().length(18, "CNPJ deve ter 18 caracteres (com formatação).")),
  address: z.string().min(5, "Endereço é obrigatório."),
  city: z.string().min(2, "Cidade é obrigatória."),
  neighborhood: z.string().min(2, "Bairro é obrigatório."),
  state: z.string().min(2, "Estado é obrigatório."),
  logoUrl: z.string().url("Deve ser uma URL válida para o logo.").startsWith("https://placehold.co/", {message: "Para demonstração, use https://placehold.co/"}),
  dataAiHint: z.string().optional().describe("Dica para IA sobre o logo (ex: company logo)"),
});
type VendorFormValues = z.infer<typeof vendorSchema>;

const salespersonSchema = z.object({
  name: z.string().min(3, "Nome do vendedor é obrigatório."),
  phone: z.string().min(10, "Telefone é obrigatório."),
  email: z.string().email("Endereço de email inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
  vendorId: z.string({ required_error: "Deve ser vinculado a um fornecedor." }),
});
type SalespersonFormValues = z.infer<typeof salespersonSchema>;

// Helper to format CNPJ for display (XX.XXX.XXX/XXXX-XX)
const formatCNPJ = (cnpj: string = '') => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj; 
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export default function ManageVendorsPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    setVendors(loadVendors());
    setSalespeople(loadSalespeople());
  }, []);

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '', cnpj: '', address: '', city: '', neighborhood: '', state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=NovoFornecedor', dataAiHint: 'company logo',
    },
  });

  const salespersonForm = useForm<SalespersonFormValues>({
    resolver: zodResolver(salespersonSchema),
    defaultValues: { name: '', phone: '', email: '', password: '', vendorId: undefined },
  });

  const handleAddNewVendor = () => {
    setEditingVendor(null);
    vendorForm.reset({
      name: '', cnpj: '', address: '', city: '', neighborhood: '', state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=Novo', dataAiHint: 'company logo',
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

  const handleDeleteVendor = (vendorId: string) => {
    // Also remove associated salespeople
    const updatedSalespeople = salespeople.filter(sp => sp.vendorId !== vendorId);
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);

    const updatedVendors = vendors.filter(v => v.id !== vendorId);
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    toast({ title: "Fornecedor Excluído!", description: "O fornecedor e seus vendedores vinculados foram removidos.", variant: "destructive" });
  };

  const onVendorSubmit = (data: VendorFormValues) => {
    let updatedVendors;
    if (editingVendor) {
      updatedVendors = vendors.map(v => v.id === editingVendor.id ? { ...editingVendor, ...data, cnpj: data.cnpj.replace(/\D/g, '') } : v);
      toast({ title: "Fornecedor Atualizado!", description: `${data.name} foi atualizado.` });
    } else {
      const newVendor: Vendor = { id: `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, ...data, cnpj: data.cnpj.replace(/\D/g, '') };
      updatedVendors = [...vendors, newVendor];
      toast({ title: "Fornecedor Cadastrado!", description: `${data.name} foi cadastrado.` });
    }
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    vendorForm.reset();
    setIsVendorDialogOpen(false);
    setEditingVendor(null);
  };

  const onSalespersonSubmit = (data: SalespersonFormValues) => {
    const newSalesperson: Salesperson = { id: `sp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, ...data };
    const updatedSalespeople = [...salespeople, newSalesperson];
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);
    const linkedVendor = vendors.find(v => v.id === data.vendorId);
    toast({ title: "Vendedor Cadastrado!", description: `${data.name} cadastrado para ${linkedVendor?.name || 'fornecedor'}.` });
    salespersonForm.reset();
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Gerenciar Fornecedores"
        description="Adicione, edite ou remova fornecedores e gerencie seus vendedores."
        icon={Briefcase}
        actions={
          <Button onClick={handleAddNewVendor}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Fornecedor
          </Button>
        }
      />

      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
            <DialogDescription>{editingVendor ? 'Atualize os detalhes deste fornecedor.' : 'Preencha os detalhes para o novo fornecedor.'}</DialogDescription>
          </DialogHeader>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField control={vendorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Ex: Soluções Farmacêuticas Ltda." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ? formatCNPJ(field.value) : ''} onChange={e => field.onChange(formatCNPJ(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Ex: Rua das Indústrias, 789" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Ex: São Paulo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Pinheiros" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl><SelectContent>{STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input type="url" placeholder="https://placehold.co/120x60.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={vendorForm.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Logo)</FormLabel><FormControl><Input placeholder="Ex: company logo" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setEditingVendor(null); vendorForm.reset(); setIsVendorDialogOpen(false); }}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={vendorForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingVendor ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Nenhum fornecedor cadastrado.</TableCell></TableRow>
              )}
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Image src={vendor.logoUrl} alt={`Logo ${vendor.name}`} width={60} height={30} className="object-contain rounded" data-ai-hint={vendor.dataAiHint || "company logo"} />
                  </TableCell>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{formatCNPJ(vendor.cnpj)}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEditVendor(vendor)}>
                      <Edit className="h-4 w-4" /><span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteVendor(vendor.id)}>
                      <Trash2 className="h-4 w-4" /><span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-12">
        <CardHeader>
          <CardTitle>Cadastrar Novo Vendedor</CardTitle>
          <CardDescription>Adicione um vendedor e vincule-o a um fornecedor existente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...salespersonForm}>
            <form onSubmit={salespersonForm.handleSubmit(onSalespersonSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={salespersonForm.control} name="vendorId" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Vincular ao Fornecedor</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger></FormControl><SelectContent>{vendors.map((v: Vendor) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}{vendors.length === 0 && <SelectItem value="disabled" disabled>Nenhum fornecedor</SelectItem>}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={salespersonForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Vendedor(a)</FormLabel><FormControl><Input placeholder="Ex: Ana Beatriz" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={salespersonForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={salespersonForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="vendas.login@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={salespersonForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha de Login</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={salespersonForm.formState.isSubmitting}><UserPlus className="mr-2 h-4 w-4" /> Cadastrar Vendedor</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    