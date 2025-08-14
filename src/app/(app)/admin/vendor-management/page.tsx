"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadVendors, saveVendors, loadUsers, saveUsers } from '@/lib/localStorageUtils';
import { ALL_BRAZILIAN_STATES } from '@/lib/constants';
import type { Vendor, User } from '@/types';
import { Briefcase, PlusCircle, Edit, Trash2, Save, Search, Eye, Loader2 } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

const vendorFormSchema = z.object({
  name: z.string().min(5, { message: "Nome da empresa deve ter pelo menos 5 caracteres." }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter 14 dígitos." }).max(18, { message: "CNPJ muito longo." }),
  address: z.string().min(10, { message: "Endereço deve ter pelo menos 10 caracteres." }),
  city: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres." }),
  neighborhood: z.string().min(2, { message: "Bairro deve ter pelo menos 2 caracteres." }),
  state: z.string().min(2, { message: "Estado é obrigatório." }),
  logoUrl: z.string().url({ message: "URL do logo deve ser válida." }),
  website: z.string().url({ message: "Website deve ser uma URL válida." }).optional().or(z.literal("")),
  // Salesperson fields
  salespersonName: z.string().min(3, { message: "Nome do vendedor deve ter pelo menos 3 caracteres." }),
  salespersonEmail: z.string().email({ message: "Email do vendedor inválido." }),
  salespersonPhone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 caracteres." }),
  salespersonPassword: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface VendorFormDialogContentProps {
  form: UseFormReturn<VendorFormValues>;
  onSubmit: (data: VendorFormValues) => void;
  editingVendor: Vendor | null;
  viewingVendor: Vendor | null;
  isSubmitting: boolean;
  isReadOnly: boolean;
}

const VendorFormDialogContentInternal = ({ form, onSubmit, editingVendor, viewingVendor, isSubmitting, isReadOnly }: VendorFormDialogContentProps) => {
  const logoUrl = form.watch("logoUrl");

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editingVendor ? 'Editar Fornecedor' : 
          (viewingVendor ? 'Visualizar Fornecedor' : 'Adicionar Novo Fornecedor')}
        </DialogTitle>
        <DialogDescription>
          {editingVendor ? 'Atualize os detalhes deste fornecedor e seu vendedor.' : 
          (viewingVendor ? 'Detalhes do fornecedor e vendedor.' : 'Preencha os detalhes para o novo fornecedor e seu vendedor.')}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <fieldset disabled={isReadOnly || !!viewingVendor}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da Empresa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_BRAZILIAN_STATES.map(state => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Logo</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {logoUrl && (
                <div className="flex justify-center">
                  <div className="relative w-32 h-16 border rounded-md overflow-hidden">
                    <Image
                      src={logoUrl}
                      alt="Preview do logo"
                      layout="fill"
                      objectFit="contain"
                      className="p-2"
                      onError={() => {}}
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Dados do Vendedor</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salespersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Vendedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do vendedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salespersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Vendedor</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="salespersonEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Vendedor (Login)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="vendedor@empresa.com" {...field} disabled={!!editingVendor} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salespersonPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Senha do Vendedor 
                        {editingVendor && <span className="text-xs text-muted-foreground ml-2">(Deixe em branco para não alterar)</span>}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={editingVendor ? "Nova senha (opcional)" : "Mínimo 6 caracteres"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </fieldset>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {viewingVendor ? 'Fechar' : 'Cancelar'}
              </Button>
            </DialogClose>
            {!viewingVendor && !isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                {editingVendor ? 'Salvar Alterações' : 'Criar Fornecedor'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

const DynamicVendorFormDialogContent = dynamic(() => Promise.resolve(VendorFormDialogContentInternal), {
  ssr: false,
  loading: () => (
    <>
      <DialogHeader>
        <DialogTitle>Carregando...</DialogTitle>
      </DialogHeader>
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Carregando formulário...</p>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
      </DialogFooter>
    </>
  ),
});

export default function AdminVendorManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  const isReadOnly = user?.role === 'manager' || user?.role === 'equipe';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Safe search params handling
  const activeTab = searchParams?.get('tab') || 'all';

  useEffect(() => {
    setVendors(loadVendors());
    setUsers(loadUsers());
  }, []);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      logoUrl: '',
      website: '',
      salespersonName: '',
      salespersonEmail: '',
      salespersonPhone: '',
      salespersonPassword: '',
    },
  });

  const filteredVendors = useMemo(() => {
    let filtered = vendors;

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(lowerSearchTerm) ||
        vendor.cnpj.includes(searchTerm.replace(/\D/g, '')) ||
        vendor.city.toLowerCase().includes(lowerSearchTerm) ||
        vendor.state.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [vendors, searchTerm]);

  const handleAddNew = () => {
    if (isReadOnly) return;
    setEditingVendor(null);
    setViewingVendor(null);
    form.reset({
      name: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      logoUrl: '',
      website: '',
      salespersonName: '',
      salespersonEmail: '',
      salespersonPhone: '',
      salespersonPassword: '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleEdit = (vendor: Vendor) => {
    if (isReadOnly) return;
    const vendorUser = users.find(u => u.role === 'vendor' && u.storeName === vendor.name);
    
    setEditingVendor(vendor);
    setViewingVendor(null);
    form.reset({
      name: vendor.name,
      cnpj: vendor.cnpj,
      address: vendor.address,
      city: vendor.city,
      neighborhood: vendor.neighborhood,
      state: vendor.state,
      logoUrl: vendor.logoUrl,
      website: vendor.website || '',
      salespersonName: vendorUser?.name || '',
      salespersonEmail: vendorUser?.email || '',
      salespersonPhone: '', // We don't store phone in User model
      salespersonPassword: '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleView = (vendor: Vendor) => {
    const vendorUser = users.find(u => u.role === 'vendor' && u.storeName === vendor.name);
    
    setViewingVendor(vendor);
    setEditingVendor(null);
    form.reset({
      name: vendor.name,
      cnpj: vendor.cnpj,
      address: vendor.address,
      city: vendor.city,
      neighborhood: vendor.neighborhood,
      state: vendor.state,
      logoUrl: vendor.logoUrl,
      website: vendor.website || '',
      salespersonName: vendorUser?.name || '',
      salespersonEmail: vendorUser?.email || '',
      salespersonPhone: '',
      salespersonPassword: '',
    });
    setIsViewDialogOpen(true);
    setIsDialogOpen(false);
  };

  const handleDelete = (vendorId: string) => {
    if (isReadOnly) return;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    // Remove vendor
    const updatedVendors = vendors.filter(v => v.id !== vendorId);
    setVendors(updatedVendors);
    saveVendors(updatedVendors);

    // Remove associated user
    const updatedUsers = users.filter(u => !(u.role === 'vendor' && u.storeName === vendor.name));
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    toast({
      title: "Fornecedor Excluído",
      description: "O fornecedor e seu usuário vendedor foram excluídos do armazenamento local.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: VendorFormValues) => {
    if (isReadOnly) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para modificar fornecedores.",
        variant: "destructive"
      });
      return;
    }

    // Validate password for new vendors
    if (!editingVendor && (!data.salespersonPassword || data.salespersonPassword.length < 6)) {
      form.setError("salespersonPassword", { message: "Senha é obrigatória e deve ter pelo menos 6 caracteres para novo fornecedor." });
      return;
    }

    // Check for duplicate emails
    const existingUser = users.find(u => 
      u.email === data.salespersonEmail && 
      (!editingVendor || u.storeName !== editingVendor.name)
    );
    if (existingUser) {
      form.setError("salespersonEmail", { message: "Este email já está em uso por outro usuário." });
      return;
    }

    let updatedVendors;
    let updatedUsers = [...users];

    if (editingVendor) {
      // Update vendor
      updatedVendors = vendors.map(v =>
        v.id === editingVendor.id ? {
          ...editingVendor,
          name: data.name,
          cnpj: data.cnpj,
          address: data.address,
          city: data.city,
          neighborhood: data.neighborhood,
          state: data.state,
          logoUrl: data.logoUrl,
          website: data.website,
        } : v
      );

      // Update associated user
      const userIndex = updatedUsers.findIndex(u => u.role === 'vendor' && u.storeName === editingVendor.name);
      if (userIndex !== -1) {
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          name: data.salespersonName,
          email: data.salespersonEmail,
          storeName: data.name, // Update company name reference
          ...(data.salespersonPassword && { password: data.salespersonPassword }),
        };
      } else {
        // Create user if it doesn't exist
        const newUser: User = {
          id: `user_vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          name: data.salespersonName,
          email: data.salespersonEmail,
          role: 'vendor',
          storeName: data.name,
          password: data.salespersonPassword || 'password123',
        };
        updatedUsers.push(newUser);
      }

      toast({
        title: "Fornecedor Atualizado!",
        description: `O fornecedor "${data.name}" foi atualizado no armazenamento local.`,
        variant: "success",
      });
    } else {
      // Create new vendor
      const newVendor: Vendor = {
        id: `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        name: data.name,
        cnpj: data.cnpj,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
        state: data.state,
        logoUrl: data.logoUrl,
        website: data.website,
      };
      updatedVendors = [...vendors, newVendor];

      // Create associated user
      const newUser: User = {
        id: `user_vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        name: data.salespersonName,
        email: data.salespersonEmail,
        role: 'vendor',
        storeName: data.name,
        password: data.salespersonPassword!,
      };
      updatedUsers.push(newUser);

      toast({
        title: "Fornecedor Criado!",
        description: `O fornecedor "${data.name}" foi criado no armazenamento local.`,
        variant: "success",
      });
    }

    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    
    form.reset();
    setIsDialogOpen(false);
    setIsViewDialogOpen(false);
    setEditingVendor(null);
    setViewingVendor(null);
  };

  const getVendorUser = (vendor: Vendor) => {
    return users.find(u => u.role === 'vendor' && u.storeName === vendor.name);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciar Fornecedores"
        description={isReadOnly ? "Visualizando fornecedores cadastrados. Apenas administradores podem editar." : "Gerencie os fornecedores participantes do evento e seus vendedores."}
        icon={Briefcase}
        iconClassName="text-secondary"
        actions={
          !isReadOnly && (
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fornecedor
            </Button>
          )
        }
      />

      <Dialog 
        open={isDialogOpen || isViewDialogOpen} 
        onOpenChange={(openState) => {
          if (!openState) {
            setIsDialogOpen(false);
            setIsViewDialogOpen(false);
            setEditingVendor(null);
            setViewingVendor(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          {(isDialogOpen || isViewDialogOpen) && (
            <DynamicVendorFormDialogContent
              form={form}
              onSubmit={onSubmit}
              editingVendor={editingVendor}
              viewingVendor={viewingVendor}
              isSubmitting={form.formState.isSubmitting}
              isReadOnly={isReadOnly}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Fornecedores Cadastrados</CardTitle>
              <CardDescription>Lista de todos os fornecedores e seus vendedores no sistema.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Logo</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Nome da Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Local</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Vendedor</TableHead>
                  <TableHead className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => {
                  const vendorUser = getVendorUser(vendor);
                  return (
                    <TableRow key={vendor.id}>
                      <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        <div className="relative w-12 h-6 sm:w-16 sm:h-8">
                          <Image
                            src={vendor.logoUrl}
                            alt={`Logo ${vendor.name}`}
                            layout="fill"
                            objectFit="contain"
                            className="rounded"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        <div className="truncate max-w-[200px]" title={vendor.name}>
                          {vendor.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 font-mono text-sm">
                        {vendor.cnpj}
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        {vendor.city} - {vendor.state}
                      </TableCell>
                      <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        {vendorUser ? (
                          <div>
                            <div className="font-medium">{vendorUser.name}</div>
                            <div className="text-xs text-muted-foreground">{vendorUser.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem vendedor</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleView(vendor)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizar</span>
                          </Button>
                          {!isReadOnly && (
                            <>
                              <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(vendor)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(vendor.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredVendors.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              {searchTerm ? "Nenhum fornecedor encontrado com os critérios de busca." : "Nenhum fornecedor cadastrado ainda."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}