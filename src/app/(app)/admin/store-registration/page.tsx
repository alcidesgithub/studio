
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
import { ClipboardPlus, Save, Edit, Trash2, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadStores, saveStores } from '@/lib/localStorageUtils';
import type { Store } from '@/types';

const storeRegistrationSchema = z.object({
  code: z.string().min(1, "Código da loja é obrigatório."),
  razaoSocial: z.string().min(3, "Razão Social deve ter pelo menos 3 caracteres."),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos.").max(18, "CNPJ deve ter 14 a 18 caracteres (com formatação)."),
  address: z.string().min(5, "Endereço é obrigatório."),
  city: z.string().min(2, "Cidade é obrigatória."),
  neighborhood: z.string().min(2, "Bairro é obrigatório."),
  state: z.enum(STATES.map(s => s.value) as [string, ...string[]], { required_error: "Estado é obrigatório." }),
  phone: z.string().min(10, "Telefone é obrigatório."),
  ownerName: z.string().min(3, "Nome do proprietário é obrigatório."),
  responsibleName: z.string().min(3, "Nome do responsável é obrigatório."),
  email: z.string().email("Endereço de email inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

// Helper to format CNPJ for display (XX.XXX.XXX/XXXX-XX)
const formatCNPJ = (cnpj: string = '') => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj; // Return original if not 14 digits
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};


export default function ManageStoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  useEffect(() => {
    setStores(loadStores());
  }, []);

  const form = useForm<StoreRegistrationFormValues>({
    resolver: zodResolver(storeRegistrationSchema),
    defaultValues: {
      code: '',
      razaoSocial: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      state: undefined,
      phone: '',
      ownerName: '',
      responsibleName: '',
      email: '',
      password: '',
    },
  });

  const handleAddNew = () => {
    setEditingStore(null);
    form.reset({ // Reset with all fields from schema
        code: '',
        razaoSocial: '',
        cnpj: '',
        address: '',
        city: '',
        neighborhood: '',
        state: undefined, // Or a default state if applicable
        phone: '',
        ownerName: '',
        responsibleName: '',
        email: '',
        password: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    // For editing, we primarily care about what's in the Store type.
    // The form has more fields, which might not be persisted on the Store object itself.
    // We reset the form with available data. If a field isn't on the store object, it will be blank.
    form.reset({
      code: store.code,
      razaoSocial: store.name, // Map store.name back to razaoSocial for the form
      cnpj: formatCNPJ(store.cnpj), // Format CNPJ for display
      // These fields might not be on the core Store type, provide defaults or load if available elsewhere
      address: (store as any).address || '', 
      city: (store as any).city || '',
      neighborhood: (store as any).neighborhood || '',
      state: (store as any).state || undefined,
      phone: (store as any).phone || '',
      ownerName: (store as any).ownerName || '',
      responsibleName: (store as any).responsibleName || '',
      email: (store as any).email || '',
      password: '', // Password should not be pre-filled for editing
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (storeId: string) => {
    const updatedStores = stores.filter(s => s.id !== storeId);
    setStores(updatedStores);
    saveStores(updatedStores);
    toast({
      title: "Loja Excluída!",
      description: "A loja foi removida do armazenamento local.",
      variant: "destructive",
    });
  };

  const onSubmit = (data: StoreRegistrationFormValues) => {
    let updatedStores;
    if (editingStore) {
      updatedStores = stores.map(s =>
        s.id === editingStore.id
          ? {
              ...s, // Keep existing fields from store type
              code: data.code,
              name: data.razaoSocial, // Update name from razaoSocial
              cnpj: data.cnpj.replace(/\D/g, ''), // Store only numbers
              // If other form fields should update the store object, add them here
              // e.g. address: data.address, city: data.city, etc.
              // For now, only core Store fields are updated on edit.
            }
          : s
      );
      toast({
        title: "Loja Atualizada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi atualizada.`,
      });
    } else {
      const newStore: Store = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        code: data.code,
        name: data.razaoSocial,
        cnpj: data.cnpj.replace(/\D/g, ''),
        participating: true,
        goalProgress: 0,
        positivationsDetails: [],
        // Persist other fields if the Store type is expanded to include them
        // For now, the Store type is lean. These extra fields from the form could be stored
        // on the Store object if the type is updated, or handled differently.
      };
      updatedStores = [...stores, newStore];
      toast({
        title: "Loja Cadastrada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi cadastrada.`,
      });
    }
    setStores(updatedStores);
    saveStores(updatedStores);
    form.reset();
    setIsDialogOpen(false);
    setEditingStore(null);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciar Lojas"
        description="Adicione, edite ou remova lojas participantes."
        icon={ClipboardPlus}
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Loja
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl"> {/* Increased width */}
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Editar Loja' : 'Adicionar Nova Loja'}</DialogTitle>
            <DialogDescription>
              {editingStore ? 'Atualize os detalhes desta loja.' : 'Preencha os detalhes para a nova loja.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader><CardTitle className="text-xl">Informações da Loja</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={form.control} name="code" render={({ field }) => (
                      <FormItem><FormLabel>Código da Loja</FormLabel><FormControl><Input placeholder="Ex: LJ001" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="razaoSocial" render={({ field }) => (
                      <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Ex: Hiperfarma Medicamentos Ltda." {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="cnpj" render={({ field }) => (
                      <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ? formatCNPJ(field.value) : ''} onChange={e => field.onChange(formatCNPJ(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Ex: Rua Principal, 123" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Ex: Curitiba" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="neighborhood" render={({ field }) => (
                      <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Centro" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl><SelectContent>{STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-xl">Contato e Login (Usuário da Loja)</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={form.control} name="ownerName" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Proprietário(a)</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="responsibleName" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Responsável (sistema)</FormLabel><FormControl><Input placeholder="Ex: Maria Oliveira" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="loja.login@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Senha de Login {editingStore ? '(Deixe em branco para não alterar)' : ''}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </CardContent>
              </Card>
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setEditingStore(null); form.reset(); setIsDialogOpen(false); }}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingStore ? 'Salvar Alterações' : 'Cadastrar Loja'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
          <CardDescription>Lista de todas as lojas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                {/* <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead> */}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhuma loja cadastrada.</TableCell></TableRow>
              )}
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.code}</TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{formatCNPJ(store.cnpj)}</TableCell>
                  {/* <TableCell>{(store as any).city || 'N/A'}</TableCell>
                  <TableCell>{(store as any).state || 'N/A'}</TableCell> */}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEdit(store)}>
                      <Edit className="h-4 w-4" /><span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(store.id)}>
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

    