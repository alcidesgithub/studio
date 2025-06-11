
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Save, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants'; // STATES can remain from constants
import { loadVendors, saveVendors, loadSalespeople, saveSalespeople } from '@/lib/localStorageUtils';
import type { Vendor, Salesperson } from '@/types';
import { useEffect, useState } from 'react';

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

export default function VendorManagementPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);

  useEffect(() => {
    setVendors(loadVendors());
    setSalespeople(loadSalespeople());
  }, []);

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=NovoFornecedor',
      dataAiHint: 'company logo',
    },
  });

  const salespersonForm = useForm<SalespersonFormValues>({
    resolver: zodResolver(salespersonSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      vendorId: undefined,
    },
  });

  const onVendorSubmit = (data: VendorFormValues) => {
    const newVendor: Vendor = {
      id: `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      ...data,
      cnpj: data.cnpj.replace(/\D/g, ''), // Store only numbers
    };
    const updatedVendors = [...vendors, newVendor];
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    toast({
      title: "Fornecedor Cadastrado!",
      description: `${data.name} foi cadastrado no armazenamento local.`,
    });
    vendorForm.reset();
  };

  const onSalespersonSubmit = (data: SalespersonFormValues) => {
    const newSalesperson: Salesperson = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      ...data,
    };
    const updatedSalespeople = [...salespeople, newSalesperson];
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);

    const linkedVendor = vendors.find(v => v.id === data.vendorId);
    toast({
      title: "Vendedor Cadastrado!",
      description: `${data.name} foi cadastrado para ${linkedVendor?.name || 'fornecedor selecionado'} no armaz. local.`,
    });
    salespersonForm.reset();
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Gerenciamento de Fornecedores e Vendedores"
        description="Cadastre novos fornecedores e seus vendedores."
        icon={Briefcase}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Cadastrar Novo Fornecedor</CardTitle>
          <CardDescription>Preencha os detalhes da nova empresa fornecedora.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={vendorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl><Input placeholder="Ex: Soluções Farmacêuticas Ltda." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl><Input placeholder="Ex: Rua das Indústrias, 789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl><Input placeholder="Ex: São Paulo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl><Input placeholder="Ex: Pinheiros" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {STATES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Logo</FormLabel>
                      <FormControl><Input type="url" placeholder="https://placehold.co/120x60.png" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={vendorForm.control}
                  name="dataAiHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dica para IA (Logo)</FormLabel>
                      <FormControl><Input placeholder="Ex: company logo, health brand" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={vendorForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> Cadastrar Fornecedor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Cadastrar Novo Vendedor</CardTitle>
          <CardDescription>Adicione um vendedor e vincule-o a um fornecedor existente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...salespersonForm}>
            <form onSubmit={salespersonForm.handleSubmit(onSalespersonSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={salespersonForm.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Vincular ao Fornecedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vendors.map((vendor: Vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                          ))}
                           {vendors.length === 0 && <SelectItem value="disabled" disabled>Nenhum fornecedor cadastrado</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Vendedor(a)</FormLabel>
                      <FormControl><Input placeholder="Ex: Ana Beatriz" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Login</FormLabel>
                      <FormControl><Input type="email" placeholder="vendas.login@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha de Login</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={salespersonForm.formState.isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Vendedor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
