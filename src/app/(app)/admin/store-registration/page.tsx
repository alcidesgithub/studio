"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadStores, saveStores } from '@/lib/localStorageUtils';
import { ALL_BRAZILIAN_STATES } from '@/lib/constants';
import type { Store } from '@/types';
import { Store as StoreIcon, PlusCircle, Edit, Trash2, Save, Search, Building, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Suspense } from 'react';

const storeFormSchema = z.object({
  code: z.string().min(3, { message: "Código da loja deve ter pelo menos 3 caracteres." }),
  name: z.string().min(5, { message: "Nome da loja deve ter pelo menos 5 caracteres." }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter 14 dígitos." }).max(18, { message: "CNPJ muito longo." }),
  participating: z.boolean(),
  address: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  ownerName: z.string().optional(),
  responsibleName: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal("")),
  isMatrix: z.boolean(),
  matrixStoreId: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface StoreFormDialogContentProps {
  form: UseFormReturn<StoreFormValues>;
  onSubmit: (data: StoreFormValues) => void;
  editingStore: Store | null;
  viewingStore: Store | null;
  isSubmitting: boolean;
  isReadOnly: boolean;
  allStores: Store[];
}

const StoreFormDialogContentInternal = ({ form, onSubmit, editingStore, viewingStore, isSubmitting, isReadOnly, allStores }: StoreFormDialogContentProps) => {
  const matrixStores = allStores.filter(s => s.isMatrix);
  const isMatrixStore = form.watch("isMatrix");

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editingStore ? 'Editar Loja' : 
          (viewingStore ? 'Visualizar Loja' : 'Adicionar Nova Loja')}
        </DialogTitle>
        <DialogDescription>
          {editingStore ? 'Atualize os detalhes desta loja.' : 
          (viewingStore ? 'Detalhes da loja.' : 'Preencha os detalhes para a nova loja.')}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <fieldset disabled={isReadOnly || !!viewingStore}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código da Loja</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: LJ001" {...field} />
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja (Razão Social)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo da loja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Proprietário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do proprietário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contato</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@loja.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 0000-0000" {...field} />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
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

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="participating"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Participando do Evento</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Esta loja está participando do evento atual?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isMatrix"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">É Loja Matriz</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Esta é uma loja matriz (não filial)?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isMatrixStore && (
                <FormField
                  control={form.control}
                  name="matrixStoreId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loja Matriz</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a loja matriz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {matrixStores.map(store => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.code} - {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </fieldset>
          <DialogFooter className="pt-3 sm:pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {viewingStore ? 'Fechar' : 'Cancelar'}
              </Button>
            </DialogClose>
            {!viewingStore && !isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                {editingStore ? 'Salvar Alterações' : 'Criar Loja'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

const DynamicStoreFormDialogContent = dynamic(() => Promise.resolve(StoreFormDialogContentInternal), {
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

function StoreRegistrationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  const isReadOnly = user?.role === 'manager' || user?.role === 'equipe';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Get tab from URL without useSearchParams
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setActiveTab(urlParams.get('tab') || 'all');
    }
  }, []);

  useEffect(() => {
    setStores(loadStores());
  }, []);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      code: '',
      name: '',
      cnpj: '',
      participating: true,
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      phone: '',
      ownerName: '',
      responsibleName: '',
      email: '',
      isMatrix: true,
      matrixStoreId: '',
    },
  });

  const filteredStores = useMemo(() => {
    let filtered = stores;

    // Filter by tab
    if (activeTab === 'participating') {
      filtered = filtered.filter(s => s.participating);
    } else if (activeTab === 'non-participating') {
      filtered = filtered.filter(s => !s.participating);
    } else if (activeTab === 'matrix') {
      filtered = filtered.filter(s => s.isMatrix);
    } else if (activeTab === 'branches') {
      filtered = filtered.filter(s => !s.isMatrix);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(lowerSearchTerm) ||
        store.code.toLowerCase().includes(lowerSearchTerm) ||
        store.cnpj.includes(searchTerm.replace(/\D/g, '')) ||
        store.ownerName?.toLowerCase().includes(lowerSearchTerm) ||
        store.responsibleName?.toLowerCase().includes(lowerSearchTerm) ||
        store.city?.toLowerCase().includes(lowerSearchTerm) ||
        store.state?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [stores, activeTab, searchTerm]);

  const updateTab = (newTab: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newTab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
    setActiveTab(newTab);
  };

  const handleAddNew = () => {
    if (isReadOnly) return;
    setEditingStore(null);
    setViewingStore(null);
    form.reset({
      code: '',
      name: '',
      cnpj: '',
      participating: true,
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      phone: '',
      ownerName: '',
      responsibleName: '',
      email: '',
      isMatrix: true,
      matrixStoreId: '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleEdit = (store: Store) => {
    if (isReadOnly) return;
    setEditingStore(store);
    setViewingStore(null);
    form.reset({
      code: store.code,
      name: store.name,
      cnpj: store.cnpj,
      participating: store.participating,
      address: store.address || '',
      city: store.city || '',
      neighborhood: store.neighborhood || '',
      state: store.state || '',
      phone: store.phone || '',
      ownerName: store.ownerName || '',
      responsibleName: store.responsibleName || '',
      email: store.email || '',
      isMatrix: store.isMatrix,
      matrixStoreId: store.matrixStoreId || '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleView = (store: Store) => {
    setViewingStore(store);
    setEditingStore(null);
    form.reset({
      code: store.code,
      name: store.name,
      cnpj: store.cnpj,
      participating: store.participating,
      address: store.address || '',
      city: store.city || '',
      neighborhood: store.neighborhood || '',
      state: store.state || '',
      phone: store.phone || '',
      ownerName: store.ownerName || '',
      responsibleName: store.responsibleName || '',
      email: store.email || '',
      isMatrix: store.isMatrix,
      matrixStoreId: store.matrixStoreId || '',
    });
    setIsViewDialogOpen(true);
    setIsDialogOpen(false);
  };

  const handleDelete = (storeId: string) => {
    if (isReadOnly) return;
    const storeToDelete = stores.find(s => s.id === storeId);
    if (!storeToDelete) return;

    // Check if this is a matrix store with branches
    const branches = stores.filter(s => s.matrixStoreId === storeId);
    if (branches.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta loja matriz possui ${branches.length} filial(is). Exclua as filiais primeiro.`,
        variant: "destructive"
      });
      return;
    }

    const updatedStores = stores.filter(s => s.id !== storeId);
    setStores(updatedStores);
    saveStores(updatedStores);
    toast({
      title: "Loja Excluída",
      description: "A loja foi excluída do armazenamento local.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: StoreFormValues) => {
    if (isReadOnly) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para modificar lojas.",
        variant: "destructive"
      });
      return;
    }

    // Validate matrix store selection for branches
    if (!data.isMatrix && !data.matrixStoreId) {
      form.setError("matrixStoreId", { message: "Selecione uma loja matriz para esta filial." });
      return;
    }

    // Check for duplicate codes
    const existingStore = stores.find(s => s.code === data.code && s.id !== editingStore?.id);
    if (existingStore) {
      form.setError("code", { message: "Já existe uma loja com este código." });
      return;
    }

    let updatedStores;
    const storeData = {
      code: data.code,
      name: data.name,
      cnpj: data.cnpj,
      participating: data.participating,
      address: data.address,
      city: data.city,
      neighborhood: data.neighborhood,
      state: data.state,
      phone: data.phone,
      ownerName: data.ownerName,
      responsibleName: data.responsibleName,
      email: data.email,
      isMatrix: data.isMatrix,
      matrixStoreId: data.isMatrix ? undefined : data.matrixStoreId,
    };

    if (editingStore) {
      updatedStores = stores.map(s =>
        s.id === editingStore.id ? { 
          ...editingStore, 
          ...storeData,
          goalProgress: editingStore.goalProgress,
          positivationsDetails: editingStore.positivationsDetails,
          currentTier: editingStore.currentTier,
          isCheckedIn: editingStore.isCheckedIn,
        } : s
      );
      toast({
        title: "Loja Atualizada!",
        description: `A loja "${data.name}" foi atualizada no armazenamento local.`,
        variant: "success",
      });
    } else {
      const newStore: Store = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        ...storeData,
        goalProgress: 0,
        positivationsDetails: [],
        isCheckedIn: false,
      };
      updatedStores = [...stores, newStore];
      toast({
        title: "Loja Criada!",
        description: `A loja "${data.name}" foi criada no armazenamento local.`,
        variant: "success",
      });
    }

    setStores(updatedStores);
    saveStores(updatedStores);
    form.reset();
    setIsDialogOpen(false);
    setIsViewDialogOpen(false);
    setEditingStore(null);
    setViewingStore(null);
  };

  const toggleCheckIn = (storeId: string) => {
    if (isReadOnly) return;
    const updatedStores = stores.map(store =>
      store.id === storeId ? { ...store, isCheckedIn: !store.isCheckedIn } : store
    );
    setStores(updatedStores);
    saveStores(updatedStores);
    
    const store = stores.find(s => s.id === storeId);
    toast({
      title: store?.isCheckedIn ? "Check-out Realizado" : "Check-in Realizado",
      description: `${store?.name} ${store?.isCheckedIn ? 'fez check-out' : 'fez check-in'} no evento.`,
      variant: "success",
    });
  };

  const getMatrixStoreName = (matrixStoreId: string | undefined) => {
    if (!matrixStoreId) return '';
    const matrixStore = stores.find(s => s.id === matrixStoreId);
    return matrixStore ? `${matrixStore.code} - ${matrixStore.name}` : 'Matriz não encontrada';
  };

  const tabCounts = useMemo(() => {
    return {
      all: stores.length,
      participating: stores.filter(s => s.participating).length,
      nonParticipating: stores.filter(s => !s.participating).length,
      matrix: stores.filter(s => s.isMatrix).length,
      branches: stores.filter(s => !s.isMatrix).length,
    };
  }, [stores]);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Cadastro de Lojas"
        description={isReadOnly ? "Visualizando lojas cadastradas. Apenas administradores podem editar." : "Gerencie as lojas participantes do evento."}
        icon={StoreIcon}
        iconClassName="text-secondary"
        actions={
          !isReadOnly && (
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Loja
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
            setEditingStore(null);
            setViewingStore(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          {(isDialogOpen || isViewDialogOpen) && (
            <DynamicStoreFormDialogContent
              form={form}
              onSubmit={onSubmit}
              editingStore={editingStore}
              viewingStore={viewingStore}
              isSubmitting={form.formState.isSubmitting}
              isReadOnly={isReadOnly}
              allStores={stores}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Lojas Cadastradas</CardTitle>
              <CardDescription>Lista de todas as lojas no sistema.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lojas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="participating">Participantes ({tabCounts.participating})</TabsTrigger>
              <TabsTrigger value="non-participating">Não Participantes ({tabCounts.nonParticipating})</TabsTrigger>
              <TabsTrigger value="matrix">Matrizes ({tabCounts.matrix})</TabsTrigger>
              <TabsTrigger value="branches">Filiais ({tabCounts.branches})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Código</TableHead>
                      <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Nome</TableHead>
                      <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">CNPJ</TableHead>
                      <TableHead className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Local</TableHead>
                      <TableHead className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Status</TableHead>
                      <TableHead className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Check-in</TableHead>
                      <TableHead className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          <div className="flex items-center gap-2">
                            {store.isMatrix ? (
                              <Building className="h-4 w-4 text-primary" title="Loja Matriz" />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                            {store.code}
                          </div>
                        </TableCell>
                        <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          <div>
                            <div className="font-medium truncate">{store.name}</div>
                            {!store.isMatrix && store.matrixStoreId && (
                              <div className="text-xs text-muted-foreground truncate">
                                Filial de: {getMatrixStoreName(store.matrixStoreId)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 font-mono text-sm">
                          {store.cnpj}
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          {store.city && store.state ? `${store.city} - ${store.state}` : 'Não informado'}
                        </TableCell>
                        <TableCell className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          <Badge variant={store.participating ? "default" : "secondary"}>
                            {store.participating ? "Participante" : "Não Participante"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          {!isReadOnly ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCheckIn(store.id)}
                              className={store.isCheckedIn ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-600"}
                            >
                              {store.isCheckedIn ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <div className="flex justify-center">
                              {store.isCheckedIn ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleView(store)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Visualizar</span>
                            </Button>
                            {!isReadOnly && (
                              <>
                                <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(store)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(store.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredStores.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  {searchTerm ? "Nenhuma loja encontrada com os critérios de busca." : "Nenhuma loja cadastrada ainda."}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminStoreRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p>Carregando página...</p></div></div>}>
      <StoreRegistrationContent />
    </Suspense>
  );
}