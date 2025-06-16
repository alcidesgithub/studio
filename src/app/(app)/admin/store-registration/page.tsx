
"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store as StoreIcon, Save, Edit, Trash2, PlusCircle, UploadCloud, FileText, Download, Eye, Loader2, Trash, KeyRound, CheckSquare, Search, Building } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadStores, saveStores, loadUsers, saveUsers } from '@/lib/localStorageUtils';
import type { Store, User } from '@/types';

const storeRegistrationSchemaBase = z.object({
  code: z.string().min(1, "Código da loja é obrigatório."),
  razaoSocial: z.string().min(3, "Razão Social deve ter pelo menos 3 caracteres."),
  cnpj: z.string().refine(value => {
    const cleaned = (value || "").replace(/\D/g, '');
    return cleaned.length === 14;
  }, { message: "CNPJ deve ter 14 dígitos (após remover formatação)." }),
  address: z.string().min(5, "Endereço é obrigatório."),
  city: z.string().min(2, "Cidade é obrigatória."),
  neighborhood: z.string().min(2, "Bairro é obrigatório."),
  state: z.enum(STATES.map(s => s.value) as [string, ...string[]], { required_error: "Estado é obrigatório." }),
  phone: z.string().min(10, "Telefone é obrigatório."),
  ownerName: z.string().min(3, "Nome do proprietário é obrigatório."),
  responsibleName: z.string().min(3, "Nome do responsável é obrigatório."),
  email: z.string().email("Endereço de email inválido."),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  isMatrix: z.boolean().default(true),
  matrixStoreCode: z.string().optional().or(z.literal('')),
});

const storeRegistrationSchema = storeRegistrationSchemaBase.superRefine((data, ctx) => {
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nova senha deve ter pelo menos 6 caracteres.",
        path: ["password"],
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
      });
    }
  } else if (!data.password && data.confirmPassword && data.confirmPassword.length > 0) {
     ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nova senha é obrigatória se a confirmação for preenchida.",
        path: ["password"],
      });
  }

  if (data.isMatrix === false) { // If it's a branch
    if (!data.matrixStoreCode || data.matrixStoreCode.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Código da Loja Matriz é obrigatório para Filial.",
        path: ["matrixStoreCode"],
      });
    }
  } else { // If it's a matrix
    if (data.matrixStoreCode && data.matrixStoreCode.trim() !== "") {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Loja Matriz não pode ter um Código de Loja Matriz.",
        path: ["matrixStoreCode"],
      });
    }
  }
});


type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

type StoreCSVData = {
  code?: string;
  razaoSocial?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  phone?: string;
  ownerName?: string;
  responsibleName?: string;
  email?: string;
  senha?: string;
  isMatrix?: string; // "TRUE" or "FALSE"
  matrixStoreCode?: string;
};

const applyCnpjMask = (value: string = ''): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 14);
  const parts = [];
  if (cleaned.length > 0) parts.push(cleaned.substring(0, 2));
  if (cleaned.length > 2) parts.push(cleaned.substring(2, 5));
  if (cleaned.length > 5) parts.push(cleaned.substring(5, 8));
  if (cleaned.length > 8) parts.push(cleaned.substring(8, 12));
  if (cleaned.length > 12) parts.push(cleaned.substring(12, 14));

  let masked = parts.shift() || "";
  if (parts.length > 0) masked += "." + parts.shift();
  if (parts.length > 0) masked += "." + parts.shift();
  if (parts.length > 0) masked += "/" + parts.shift();
  if (parts.length > 0) masked += "-" + parts.shift();

  return masked;
};

const formatDisplayCNPJ = (cnpj: string = '') => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const cleanCNPJ = (cnpj: string = '') => {
    return cnpj.replace(/\D/g, '');
};

const getDisplayState = (stateValue?: string) => {
  if (!stateValue) return 'N/A';
  const stateObj = STATES.find(s => s.value === stateValue);
  return stateObj ? stateObj.label.split(' (')[0] : stateValue;
};

function parseCSVToStores(csvText: string, existingStores: Store[]): { data: StoreCSVData[], errors: string[] } {
    const allLines = csvText.trim().split(/\r\n|\n/);
    if (allLines.length < 2) {
        return { data: [], errors: ["Arquivo CSV vazio ou sem dados."] };
    }

    const headerLine = allLines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));

    const headerMap: Record<string, keyof StoreCSVData> = {
        "codigo": "code", "razaosocial": "razaoSocial", "cnpj": "cnpj", "endereco": "address",
        "cidade": "city", "bairro": "neighborhood", "estado": "state", "telefone": "phone",
        "nomeproprietario": "ownerName", "nomeresponsavel": "responsibleName", "email": "email", "senha": "senha",
        "ismatrix": "isMatrix", "matrixstorecode": "matrixStoreCode",
    };
    
    const requiredCsvHeaders = ["codigo", "razaosocial", "cnpj", "email", "ismatrix"];
    const expectedHeadersForDescription = Object.keys(headerMap);

    const missingRequiredHeaders = requiredCsvHeaders.filter(reqH => !headers.includes(reqH));
    if (missingRequiredHeaders.length > 0) {
        return { data: [], errors: [`Cabeçalhos obrigatórios faltando no CSV: ${missingRequiredHeaders.join(', ')}. Certifique-se que a primeira linha contém pelo menos: ${requiredCsvHeaders.join(', ')} e opcionalmente os demais: ${expectedHeadersForDescription.filter(h => !requiredCsvHeaders.includes(h)).join(', ')}`] };
    }

    const storesData: StoreCSVData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const storeRow: StoreCSVData = {};
        let hasErrorInRow = false;

        headers.forEach((header, index) => {
            const mappedKey = headerMap[header];
            if (mappedKey) {
                (storeRow as any)[mappedKey] = values[index];
            }
        });

        if (!storeRow.code || !storeRow.razaoSocial || !storeRow.cnpj || !storeRow.email || !storeRow.isMatrix) {
            errors.push(`Linha ${i + 1}: Dados essenciais (código, razão social, cnpj, email, isMatrix) faltando.`);
            hasErrorInRow = true;
        }

        if (storeRow.isMatrix && storeRow.isMatrix.toUpperCase() !== 'TRUE' && storeRow.isMatrix.toUpperCase() !== 'FALSE') {
             errors.push(`Linha ${i + 1} (Loja ${storeRow.code || 'sem código'}): Valor inválido para 'isMatrix'. Use TRUE ou FALSE.`);
             hasErrorInRow = true;
        }

        if (storeRow.isMatrix && storeRow.isMatrix.toUpperCase() === 'FALSE') {
            if (!storeRow.matrixStoreCode || storeRow.matrixStoreCode.trim() === '') {
                errors.push(`Linha ${i + 1} (Loja ${storeRow.code || 'sem código'}): 'matrixStoreCode' é obrigatório se 'isMatrix' é FALSE.`);
                hasErrorInRow = true;
            } else {
                // Defer detailed matrix existence check to processing phase to handle matrices in same CSV.
            }
        }
        
        if (storeRow.senha && storeRow.senha.length < 6) {
             errors.push(`Linha ${i + 1} (Loja ${storeRow.code || 'sem código'}): Senha fornecida deve ter pelo menos 6 caracteres.`);
             hasErrorInRow = true;
        }

        if (!hasErrorInRow) {
            storesData.push(storeRow);
        }
    }
    return { data: storesData, errors };
}

interface StoreFormDialogContentProps {
  form: UseFormReturn<StoreRegistrationFormValues>;
  onSubmit: (data: StoreRegistrationFormValues) => void;
  editingStore: Store | null;
  viewingStore: Store | null;
  isSubmitting: boolean;
  allStores: Store[]; // Pass all stores for validation
}

const StoreFormDialogContentInternal = ({ form, onSubmit, editingStore, viewingStore, isSubmitting, allStores }: StoreFormDialogContentProps) => {
  const showPasswordFields = !viewingStore; 
  const currentIsMatrix = form.watch("isMatrix");

  const disableMatrixFields = !!viewingStore || (!!editingStore && editingStore.isMatrix && allStores.some(s => s.matrixStoreId === editingStore.id && s.id !== editingStore.id));

  return (
    <>
      <DialogHeader>
        <DialogTitle>
            {editingStore ? 'Editar Loja' :
            (viewingStore ? 'Visualizar Loja' : 'Adicionar Nova Loja')}
        </DialogTitle>
        <DialogDescription>
          {editingStore ? 'Atualize os detalhes desta loja. Deixe os campos de senha em branco para não alterá-la.' :
          (viewingStore ? 'Detalhes da loja.' : 'Preencha os detalhes da loja.')}
          {disableMatrixFields && editingStore && <span className="block text-xs text-orange-600 mt-1">Esta loja é uma matriz com filiais vinculadas. Para alterar o tipo ou vincular a outra matriz, desvincule as filiais primeiro.</span>}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Informações da Loja</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Código da Loja</FormLabel><FormControl><Input placeholder="Ex: 001" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="razaoSocial" render={({ field }) => (
                  <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Ex: Hiperfarma Medicamentos Ltda." {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0000-00"
                        {...field}
                        value={field.value}
                        onChange={e => field.onChange(applyCnpjMask(e.target.value))}
                        disabled={!!viewingStore || !!editingStore} 
                        maxLength={18}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Ex: Rua Roberto Faria, 180" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Município</FormLabel><FormControl><Input placeholder="Ex: Curitiba" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="neighborhood" render={({ field }) => (
                  <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Fanny" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!!viewingStore}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl><SelectContent>{STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField
                  control={form.control}
                  name="isMatrix"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 space-y-2">
                      <FormLabel>Tipo de Loja</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === 'true')}
                          value={String(field.value)}
                          className="flex items-center space-x-4"
                          disabled={disableMatrixFields}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="isMatrix-true" />
                            <Label htmlFor="isMatrix-true" className="font-normal">Matriz</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="isMatrix-false" />
                            <Label htmlFor="isMatrix-false" className="font-normal">Filial</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {currentIsMatrix === false && (
                  <FormField
                    control={form.control}
                    name="matrixStoreCode"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Código da Loja Matriz</FormLabel>
                        <FormControl>
                          <Input placeholder="Insira o código da loja matriz" {...field} disabled={!!viewingStore || disableMatrixFields} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg sm:text-xl">Contato e Login (Usuário da Loja)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
              <FormField control={form.control} name="ownerName" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Proprietário(a)</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="responsibleName" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Responsável (login sistema)</FormLabel><FormControl><Input placeholder="Ex: Maria Oliveira" {...field} disabled={!!viewingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="loja.login@example.com" {...field} disabled={!!viewingStore || !!editingStore} /></FormControl><FormMessage /></FormItem>
              )}/>
              {showPasswordFields && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {editingStore ? "Nova Senha" : "Senha"}
                          {editingStore && <span className="text-xs text-muted-foreground"> (Deixe em branco para não alterar)</span>}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={editingStore ? "Nova senha (opcional)" : "Mínimo 6 caracteres"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar {editingStore ? "Nova " : ""}Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Repita a senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
          <DialogFooter className="pt-3 sm:pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    {viewingStore ? 'Fechar' : 'Cancelar'}
                </Button>
            </DialogClose>
            {!viewingStore && (
                <Button type="submit" disabled={isSubmitting || (disableMatrixFields && !!editingStore)}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                  {editingStore ? 'Salvar Alterações' : 'Cadastrar Loja'}
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


export default function ManageStoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);

  const [isImportStoreDialogOpen, setIsImportStoreDialogOpen] = useState(false);
  const [csvStoreFile, setCsvStoreFile] = useState<File | null>(null);
  const [csvStoreFileName, setCsvStoreFileName] = useState<string>("");
  const [importStoreLoading, setImportStoreLoading] = useState(false);
  const [importStoreErrors, setImportStoreErrors] = useState<string[]>([]);

  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isDeleteSelectedConfirmOpen, setIsDeleteSelectedConfirmOpen] = useState(false);


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
      confirmPassword: '',
      isMatrix: true,
      matrixStoreCode: '',
    },
  });

  const handleAddNew = () => {
    setEditingStore(null);
    setViewingStore(null);
    form.reset({
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
        confirmPassword: '',
        isMatrix: true,
        matrixStoreCode: '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setViewingStore(null);
    const matrixStore = store.isMatrix === false && store.matrixStoreId ? stores.find(s => s.id === store.matrixStoreId) : undefined;
    form.reset({
      code: store.code,
      razaoSocial: store.name,
      cnpj: formatDisplayCNPJ(store.cnpj),
      address: store.address || '',
      city: store.city || '',
      neighborhood: store.neighborhood || '',
      state: store.state || undefined,
      phone: store.phone || '',
      ownerName: store.ownerName || '',
      responsibleName: store.responsibleName || '',
      email: store.email || '',
      password: '', 
      confirmPassword: '',
      isMatrix: store.isMatrix,
      matrixStoreCode: store.isMatrix === false ? (matrixStore?.code || '') : '',
    });
    setIsDialogOpen(true);
    setIsViewDialogOpen(false);
  };

  const handleView = (store: Store) => {
    setViewingStore(store);
    setEditingStore(null);
    const matrixStore = store.isMatrix === false && store.matrixStoreId ? stores.find(s => s.id === store.matrixStoreId) : undefined;
    form.reset({
      code: store.code,
      razaoSocial: store.name,
      cnpj: formatDisplayCNPJ(store.cnpj),
      address: store.address || '',
      city: store.city || '',
      neighborhood: store.neighborhood || '',
      state: store.state || undefined,
      phone: store.phone || '',
      ownerName: store.ownerName || '',
      responsibleName: store.responsibleName || '',
      email: store.email || '',
      password: '',
      confirmPassword: '',
      isMatrix: store.isMatrix,
      matrixStoreCode: store.isMatrix === false ? (matrixStore?.code || '') : '',
    });
    setIsViewDialogOpen(true);
    setIsDialogOpen(false);
  };

  const handleDelete = (storeId: string) => {
    const storeToDelete = stores.find(s => s.id === storeId);
    if (storeToDelete && storeToDelete.email) {
        const currentUsers = loadUsers();
        const usersToKeep = currentUsers.filter(u => u.email !== storeToDelete.email || u.role !== 'store');
        if (usersToKeep.length < currentUsers.length) {
            saveUsers(usersToKeep);
            toast({
                title: "Usuário da Loja Removido",
                description: `O usuário associado ao email ${storeToDelete.email} foi removido.`,
                variant: "default"
            });
        }
    }
    
    let updatedStores = stores.filter(s => s.id !== storeId);
    // If deleting a matrix, orphan its branches for now
    if (storeToDelete?.isMatrix) {
        updatedStores = updatedStores.map(s => s.matrixStoreId === storeId ? { ...s, matrixStoreId: undefined } : s);
        toast({ title: "Aviso", description: `Filiais da loja matriz ${storeToDelete.name} foram desvinculadas.`, variant: "default"});
    }


    setStores(updatedStores);
    saveStores(updatedStores);
    setSelectedStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeId);
        return newSet;
    });
    toast({
      title: "Loja Excluída!",
      description: "A loja foi removida do armazenamento local.",
      variant: "destructive",
    });
  };

  const onSubmit = (data: StoreRegistrationFormValues) => {
    let updatedStores;
    let matrixStoreIdFromCode: string | undefined = undefined;

    if (data.isMatrix === false) {
      if (!data.matrixStoreCode || data.matrixStoreCode.trim() === "") {
        form.setError("matrixStoreCode", { type: "manual", message: "Código da Loja Matriz é obrigatório para Filial." });
        return;
      }
      const matrixStore = stores.find(s => s.code === data.matrixStoreCode?.trim() && s.isMatrix);
      if (!matrixStore) {
        form.setError("matrixStoreCode", { type: "manual", message: "Loja Matriz inválida (código não encontrado ou não é uma matriz)." });
        return;
      }
      if (editingStore && editingStore.id === matrixStore.id) {
         form.setError("matrixStoreCode", { type: "manual", message: "Uma loja não pode ser filial de si mesma." });
        return;
      }
      matrixStoreIdFromCode = matrixStore.id;
    }


    const storeDataToSave = {
      code: data.code,
      name: data.razaoSocial,
      cnpj: cleanCNPJ(data.cnpj),
      address: data.address,
      city: data.city,
      neighborhood: data.neighborhood,
      state: data.state,
      phone: data.phone,
      ownerName: data.ownerName,
      responsibleName: data.responsibleName,
      email: data.email,
      isMatrix: data.isMatrix,
      matrixStoreId: data.isMatrix ? undefined : matrixStoreIdFromCode,
    };

    const currentUsers = loadUsers();
    
    if (editingStore) {
      if (editingStore.isMatrix && !data.isMatrix && stores.some(s => s.matrixStoreId === editingStore.id)) {
        toast({ title: "Erro de Validação", description: "Esta loja é uma matriz com filiais vinculadas. Desvincule as filiais antes de alterá-la para filial.", variant: "destructive"});
        return;
      }
      // Check for CNPJ/Code uniqueness if they are changed (though they are disabled for edit in this form)
      // Check if email is being changed (also disabled)

      const userIndex = currentUsers.findIndex(u => u.email === editingStore.email && u.role === 'store');
      updatedStores = stores.map(s =>
        s.id === editingStore.id
          ? { ...s, ...storeDataToSave, isCheckedIn: s.isCheckedIn } 
          : s
      );
      toast({
        title: "Loja Atualizada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi atualizada.`,
        variant: "success",
      });
      
      if (userIndex > -1) {
        currentUsers[userIndex].name = data.responsibleName;
        currentUsers[userIndex].storeName = data.razaoSocial;
        if (data.password && data.password.length > 0) {
          currentUsers[userIndex].password = data.password;
           toast({
            title: "Senha do Usuário Atualizada!",
            description: `A senha para ${currentUsers[userIndex].email} foi atualizada.`,
            variant: "success",
          });
        }
        saveUsers(currentUsers);
      }
    } else { // New store
      if (!data.password || data.password.length === 0) {
        form.setError("password", {type: "manual", message: "Senha é obrigatória para novo cadastro."});
        toast({ title: "Erro de Validação", description: "Senha é obrigatória para criar o usuário da loja.", variant: "destructive"});
        return;
      }
      if (data.password.length < 6 || (data.password !== data.confirmPassword)) {
        toast({ title: "Erro de Validação", description: "Verifique os campos de senha.", variant: "destructive"});
        return;
      }

      const existingUserWithEmail = currentUsers.find(u => u.email === data.email && u.role === 'store');
      if (existingUserWithEmail) { 
        form.setError("email", { type: "manual", message: "Este email já está em uso por outro usuário de loja." });
        toast({ title: "Erro", description: "Email já cadastrado para um usuário de loja.", variant: "destructive" });
        return;
      }
      const existingStoreWithCNPJ = stores.find(s => s.cnpj === cleanCNPJ(data.cnpj));
      if (existingStoreWithCNPJ) {
        form.setError("cnpj", { type: "manual", message: "Este CNPJ já está cadastrado." });
        toast({ title: "Erro", description: "CNPJ já cadastrado.", variant: "destructive" });
        return;
      }
      const existingStoreWithCode = stores.find(s => s.code === data.code);
      if (existingStoreWithCode) {
        form.setError("code", { type: "manual", message: "Este Código de Loja já está cadastrado." });
        toast({ title: "Erro", description: "Código de Loja já cadastrado.", variant: "destructive" });
        return;
      }

      const newStore: Store = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        ...storeDataToSave,
        participating: true,
        goalProgress: 0,
        positivationsDetails: [],
        isCheckedIn: false,
      };
      updatedStores = [...stores, newStore];
      toast({
        title: "Loja Cadastrada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi cadastrada.`,
        variant: "success",
      });

      const newUserForStore: User = {
        id: `user_store_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
        email: data.email,
        role: 'store',
        name: data.responsibleName,
        storeName: data.razaoSocial,
        password: data.password, 
      };
      currentUsers.push(newUserForStore);
      saveUsers(currentUsers);
      toast({
        title: "Usuário da Loja Criado!",
        description: `Um login foi criado para ${data.email}.`,
        variant: "success",
      });
    }
    setStores(updatedStores);
    saveStores(updatedStores);
    form.reset();
    setIsDialogOpen(false);
    setEditingStore(null);
  };

  const handleStoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvStoreFile(file);
      setCsvStoreFileName(file.name);
      setImportStoreErrors([]);
    } else {
      setCsvStoreFile(null);
      setCsvStoreFileName("");
    }
  };

  const handleDownloadSampleStoreCSV = () => {
    const csvHeader = "codigo,razaosocial,cnpj,endereco,cidade,bairro,estado,telefone,nomeproprietario,nomeresponsavel,email,senha,isMatrix,matrixStoreCode\n";
    const csvExampleRow1 = `"LJ998","Farmácia Exemplo Sul Ltda.","11222333000188","Rua Modelo Sul, 789","Curitiba","Portão","PR","(41) 99999-0001","Carlos Exemplo","Ana Modelo","loja.exsul@example.com","senhaSegura123","TRUE",""\n`;
    const csvExampleRow2 = `"LJ999","Drogaria Boa Saúde Oeste S.A.","44555666000199","Avenida Teste Oeste, 1011","Joinville","Centro","SC","(47) 98888-0002","Fernanda Teste","Ricardo Boa","loja.bsoeste@example.com","outraSenha456","FALSE","LJ998"\n`;
    const csvExampleRow3 = `"LJ1000","Mais Saúde Farma","10111213000112","Praça Central, 01","Curitiba","Rebouças","PR","(41) 97777-0003","José Praça","Maria Central","loja.central@example.com","","TRUE",""\n`;

    const csvContent = csvHeader + csvExampleRow1 + csvExampleRow2 + csvExampleRow3;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "exemplo_lojas_matriz_filial.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleProcessStoreImport = async () => {
    if (!csvStoreFile) {
      toast({ title: "Nenhum arquivo selecionado", description: "Por favor, selecione um arquivo CSV.", variant: "destructive" });
      return;
    }
    setImportStoreLoading(true);
    setImportStoreErrors([]);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const currentLocalStores = loadStores();
      const { data: parsedStoreRows, errors: parsingErrors } = parseCSVToStores(text, currentLocalStores);

      if (parsingErrors.length > 0) {
        setImportStoreErrors(parsingErrors);
        setImportStoreLoading(false);
        toast({ title: "Erro ao Ler CSV", description: "Verifique os erros listados e o formato do arquivo.", variant: "destructive" });
        return;
      }

      const currentLocalUsers = loadUsers();
      const newStoresToSave: Store[] = [];
      const newUsersToSave: User[] = [];
      const validationErrors: string[] = [];
      let importedCount = 0;
      
      // Temporary list to validate matrix codes within the import batch
      const allStoresForValidation = [...currentLocalStores];

      for (let i = 0; i < parsedStoreRows.length; i++) {
        const ps = parsedStoreRows[i];
        try {
          const cleanedCsvCnpj = cleanCNPJ(ps.cnpj || "");
          const passwordFromCsv = ps.senha;
          const passwordForUser = (passwordFromCsv && passwordFromCsv.length >= 6) ? passwordFromCsv : "PadraoHiper123!"; 
          const isMatrixFromCsv = ps.isMatrix?.toUpperCase() === 'TRUE';
          
          let matrixStoreIdFromCsvCode: string | undefined = undefined;
          if (!isMatrixFromCsv && ps.matrixStoreCode) {
            const potentialMatrix = allStoresForValidation.concat(newStoresToSave).find(s => s.code === ps.matrixStoreCode && s.isMatrix);
            if (potentialMatrix) {
              matrixStoreIdFromCsvCode = potentialMatrix.id;
            } else {
              validationErrors.push(`Linha ${i + 2} (Loja ${ps.code || 'sem código'}): Código de matriz '${ps.matrixStoreCode}' não encontrado ou não é uma matriz (verifique se a matriz está antes no CSV ou já existe).`);
              continue;
            }
          } else if (!isMatrixFromCsv && !ps.matrixStoreCode) {
            validationErrors.push(`Linha ${i + 2} (Loja ${ps.code || 'sem código'}): 'matrixStoreCode' é obrigatório para filial.`);
            continue;
          }

          const storeInputData = {
            code: ps.code || "",
            razaoSocial: ps.razaoSocial || "",
            cnpj: cleanedCsvCnpj, 
            address: ps.address || "",
            city: ps.city || "",
            neighborhood: ps.neighborhood || "",
            state: ps.state || "",
            phone: ps.phone || "",
            ownerName: ps.ownerName || "",
            responsibleName: ps.responsibleName || "",
            email: ps.email || "",
            password: passwordForUser, 
            confirmPassword: passwordForUser, 
            isMatrix: isMatrixFromCsv,
            matrixStoreCode: isMatrixFromCsv ? '' : (ps.matrixStoreCode || ''),
          };

          const validationResult = storeRegistrationSchema.safeParse(storeInputData);

          if (!validationResult.success) {
            const fieldErrors = validationResult.error.errors.map(err => `Linha ${i + 2} (Loja ${ps.code || 'sem código'}): ${err.path.join('.')} - ${err.message}`).join('; ');
            validationErrors.push(fieldErrors);
            continue;
          }

          const validatedData = validationResult.data;

          if (allStoresForValidation.concat(newStoresToSave).some(s => s.code === validatedData.code)) {
            validationErrors.push(`Linha ${i + 2}: Código de loja ${validatedData.code} já existe e foi ignorado.`);
            continue;
          }
          if (allStoresForValidation.concat(newStoresToSave).some(s => s.cnpj === validatedData.cnpj)) {
            validationErrors.push(`Linha ${i + 2}: CNPJ ${formatDisplayCNPJ(validatedData.cnpj)} já existe e foi ignorado.`);
            continue;
          }
          if (currentLocalUsers.concat(newUsersToSave).some(u => u.email === validatedData.email && u.role === 'store')) {
             validationErrors.push(`Linha ${i + 2}: Email ${validatedData.email} já cadastrado para outra loja e foi ignorado.`);
            continue;
          }

          const newStore: Store = {
            id: `store_csv_${Date.now()}_${i}`,
            code: validatedData.code,
            name: validatedData.razaoSocial,
            cnpj: validatedData.cnpj,
            address: validatedData.address,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            state: validatedData.state,
            phone: validatedData.phone,
            ownerName: validatedData.ownerName,
            responsibleName: validatedData.responsibleName,
            email: validatedData.email,
            participating: true,
            goalProgress: 0,
            positivationsDetails: [],
            isCheckedIn: false,
            isMatrix: validatedData.isMatrix,
            matrixStoreId: validatedData.isMatrix ? undefined : matrixStoreIdFromCsvCode,
          };
          newStoresToSave.push(newStore);

          const existingUser = currentLocalUsers.find(u => u.email === validatedData.email);
          if (!existingUser) { 
            const newUserForStore: User = {
              id: `user_store_csv_${Date.now()}_${i}`,
              email: validatedData.email,
              role: 'store',
              name: validatedData.responsibleName,
              storeName: validatedData.razaoSocial,
              password: passwordForUser,
            };
            newUsersToSave.push(newUserForStore);
          } else {
             validationErrors.push(`Linha ${i + 2}: Email ${validatedData.email} já existe para um usuário. A loja será criada, mas o usuário existente não será modificado por esta importação.`);
          }
          importedCount++;
        } catch (error) {
            validationErrors.push(`Linha ${i + 2} (Loja ${ps.code || 'sem nome'}): Erro inesperado - ${(error as Error).message}`);
        }
      }

      if (newStoresToSave.length > 0) {
        const updatedStoreList = [...currentLocalStores, ...newStoresToSave];
        saveStores(updatedStoreList);
        setStores(updatedStoreList);
      }
      if (newUsersToSave.length > 0) {
        const updatedUserList = [...currentLocalUsers, ...newUsersToSave];
        saveUsers(updatedUserList);
      }

      setImportStoreErrors(validationErrors);
      setImportStoreLoading(false);

      if (importedCount > 0 && validationErrors.length === 0) {
        toast({ title: "Importação Concluída!", description: `${importedCount} lojas e seus respectivos usuários (se novos) foram importados com sucesso.`, variant: "success" });
        setIsImportStoreDialogOpen(false);
        setCsvStoreFile(null);
        setCsvStoreFileName("");
      } else if (importedCount > 0 && validationErrors.length > 0) {
        toast({ title: "Importação Parcial", description: `${importedCount} lojas importadas. Alguns registros tiveram erros ou avisos.`, variant: "default" });
      } else if (importedCount === 0 && validationErrors.length > 0) {
        toast({ title: "Falha na Importação", description: "Nenhuma loja importada devido a erros. Verifique os detalhes.", variant: "destructive" });
      } else if (importedCount === 0 && validationErrors.length === 0 && parsedStoreRows.length > 0) {
         toast({ title: "Nenhuma Nova Loja", description: "Nenhuma nova loja para importar (possivelmente todas já existem).", variant: "default" });
      } else {
         toast({ title: "Nenhum dado para importar", description: "O arquivo CSV parece não conter dados de lojas válidos.", variant: "default" });
      }
    };

    reader.onerror = () => {
      toast({ title: "Erro ao ler arquivo", description: "Não foi possível ler o arquivo selecionado.", variant: "destructive" });
      setImportStoreLoading(false);
    };
    reader.readAsText(csvStoreFile);
  };

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
      } else {
        newSet.add(storeId);
      }
      return newSet;
    });
  };

  const handleSelectAllStores = () => {
    if (selectedStoreIds.size === filteredStores.length) {
      setSelectedStoreIds(new Set());
    } else {
      setSelectedStoreIds(new Set(filteredStores.map(s => s.id)));
    }
  };

  const handleConfirmDeleteSelected = () => {
    if (selectedStoreIds.size === 0) return;

    const storesToDelete = stores.filter(s => selectedStoreIds.has(s.id));
    const emailsOfStoresToDelete = storesToDelete.map(s => s.email).filter(Boolean) as string[];

    const currentUsers = loadUsers();
    const usersToKeep = currentUsers.filter(u => !(u.role === 'store' && u.email && emailsOfStoresToDelete.includes(u.email)));

    if (usersToKeep.length < currentUsers.length) {
      saveUsers(usersToKeep);
    }

    let updatedStores = stores.filter(s => !selectedStoreIds.has(s.id));
    // Orphan branches of deleted matrices
    const deletedMatrixIds = storesToDelete.filter(s => s.isMatrix).map(s => s.id);
    if (deletedMatrixIds.length > 0) {
        updatedStores = updatedStores.map(s => deletedMatrixIds.includes(s.matrixStoreId || '') ? { ...s, matrixStoreId: undefined } : s);
    }
    
    setStores(updatedStores);
    saveStores(updatedStores);

    toast({
      title: `${selectedStoreIds.size} Loja(s) Excluída(s)!`,
      description: "As lojas selecionadas e seus usuários associados foram removidos.",
      variant: "destructive"
    });
    setSelectedStoreIds(new Set());
    setIsDeleteSelectedConfirmOpen(false);
  };

  const handleToggleCheckIn = (storeId: string, checked: boolean) => {
    const updatedStores = stores.map(s =>
      s.id === storeId ? { ...s, isCheckedIn: checked } : s
    );
    setStores(updatedStores);
    saveStores(updatedStores);
    const storeName = updatedStores.find(s => s.id === storeId)?.name || 'Loja';
    toast({
      title: `Check-in ${checked ? 'Confirmado' : 'Desfeito'}`,
      description: `${storeName} ${checked ? 'agora está com check-in.' : 'não está mais com check-in.'}`,
      variant: "success",
    });
  };
  
  const filteredStores = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      return stores; // Return all stores if search term is empty
    }
    const cleanedSearchTermForCnpj = searchTerm.replace(/\D/g, '');

    const directlyMatchingMatrix = stores.find(
      s => s.code.toLowerCase() === lowerSearchTerm && s.isMatrix
    );
    
    let branchesOfMatchedMatrix: Store[] = [];
    if (directlyMatchingMatrix) {
        branchesOfMatchedMatrix = stores.filter(
            s => s.matrixStoreId === directlyMatchingMatrix.id
        );
    }

    const results = stores.filter(store => {
      // If a matrix was directly matched by code, include its branches (already handled by branchesOfMatchedMatrix)
      // and the matrix itself (also handled if directlyMatchingMatrix exists)

      const checkString = (value?: string) => value?.toLowerCase().includes(lowerSearchTerm);
      
      const checkCnpj = (cnpjValue?: string) => { 
        if (!cnpjValue) return false;
        const cleanedStoreCnpj = cleanCNPJ(cnpjValue);
        if (cleanedSearchTermForCnpj.length > 0 && cleanedStoreCnpj.includes(cleanedSearchTermForCnpj)) {
          return true;
        }
        if (cnpjValue.toLowerCase().includes(lowerSearchTerm)) { // Check raw formatted CNPJ as well
            return true;
        }
        return false;
      };

      return (
        checkString(store.code) ||
        checkString(store.name) ||
        checkCnpj(store.cnpj) ||
        checkString(store.address) ||
        checkString(store.city) ||
        checkString(store.neighborhood) ||
        checkString(getDisplayState(store.state)) ||
        checkString(store.phone) ||
        checkString(store.ownerName) ||
        checkString(store.responsibleName) ||
        checkString(store.email)
      );
    });
    
    // Combine results and remove duplicates if any (e.g. matrix matched by name and also by code)
    const combinedResults = new Set([...results, ...branchesOfMatchedMatrix]);
    if (directlyMatchingMatrix) combinedResults.add(directlyMatchingMatrix);
    
    return Array.from(combinedResults);

  }, [stores, searchTerm]);

  const isAllStoresSelected = useMemo(() => filteredStores.length > 0 && selectedStoreIds.size === filteredStores.length && filteredStores.every(s => selectedStoreIds.has(s.id)), [filteredStores, selectedStoreIds]);


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Lojas"
        description="Adicione, edite ou remova lojas participantes. Confirme o check-in das lojas presentes."
        icon={StoreIcon}
        iconClassName="text-secondary"
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedStoreIds.size > 0 && (
              <Button onClick={() => setIsDeleteSelectedConfirmOpen(true)} variant="destructive" className="w-full sm:w-auto">
                <Trash className="mr-2 h-4 w-4" /> Excluir ({selectedStoreIds.size})
              </Button>
            )}
            <Button onClick={() => setIsImportStoreDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Importar (CSV)
            </Button>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Loja
            </Button>
          </div>
        }
      />

      <AlertDialog open={isDeleteSelectedConfirmOpen} onOpenChange={setIsDeleteSelectedConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedStoreIds.size} loja(s) selecionada(s)?
              Esta ação também removerá os usuários de login associados a estas lojas. Filiais de matrizes excluídas serão desvinculadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteSelectedConfirmOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSelected} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir Selecionadas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <DialogContent className="sm:max-w-3xl">
           {(isDialogOpen || isViewDialogOpen) && (
            <DynamicStoreFormDialogContent
              form={form}
              onSubmit={onSubmit}
              editingStore={editingStore}
              viewingStore={viewingStore}
              isSubmitting={form.formState.isSubmitting}
              allStores={stores}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isImportStoreDialogOpen} onOpenChange={(isOpen) => {
        setIsImportStoreDialogOpen(isOpen);
        if (!isOpen) {
          setCsvStoreFile(null);
          setCsvStoreFileName("");
          setImportStoreErrors([]);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar Lojas (CSV)</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV para importar lojas em massa.
              A primeira linha (cabeçalho) deve conter pelo menos os campos obrigatórios:
              <code className="block bg-muted p-2 rounded-md my-2 text-xs break-all">codigo,razaosocial,cnpj,email,isMatrix</code>
              Se 'isMatrix' for 'FALSE', 'matrixStoreCode' também é obrigatório.
              Opcionalmente:
              <code className="block bg-muted p-2 rounded-md my-1 text-xs break-all">endereco,cidade,bairro,estado,telefone,nomeproprietario,nomeresponsavel,senha</code>
              A coluna 'senha' é opcional; se não fornecida ou inválida (menos de 6 caracteres), uma senha padrão será usada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div>
              <label htmlFor="csv-store-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Arquivo CSV</label>
              <Input
                id="csv-store-upload"
                type="file"
                accept=".csv"
                onChange={handleStoreFileSelect}
                className="mt-1 h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {csvStoreFileName && (
              <div className="text-sm text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Arquivo selecionado: {csvStoreFileName}
              </div>
            )}
            <Button type="button" variant="link" size="sm" onClick={handleDownloadSampleStoreCSV} className="p-0 h-auto text-primary text-xs sm:text-sm">
              <Download className="mr-1 h-3 w-3" /> Baixar CSV de Exemplo (com Matriz/Filial)
            </Button>
            {importStoreErrors.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <h4 className="font-semibold text-destructive mb-2">Erros na Importação de Lojas:</h4>
                <ul className="list-disc list-inside text-xs text-destructive space-y-1">
                  {importStoreErrors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleProcessStoreImport} disabled={!csvStoreFile || importStoreLoading}>
              {importStoreLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {importStoreLoading ? 'Importando...' : 'Importar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="my-4 sm:my-6 relative flex items-center max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar lojas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="shadow-lg mt-0">
        <CardHeader className="px-4 py-5 sm:p-6">
          <CardTitle>Lojas Cadastradas</CardTitle>
          <CardDescription>Lista de todas as lojas no sistema. Use o ícone <Building size={14} className="inline text-muted-foreground"/> para identificar filiais.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                     <Checkbox
                        checked={isAllStoresSelected}
                        onCheckedChange={handleSelectAllStores}
                        aria-label="Selecionar todas as lojas visíveis"
                        disabled={filteredStores.length === 0}
                      />
                  </TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Código</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Razão Social</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">CNPJ</TableHead>
                  <TableHead className="hidden lg:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Email (Login)</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Município</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Estado</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 text-center">Check-in</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-4 px-1.5 sm:px-2 md:px-3 lg:px-4">
                    {searchTerm ? "Nenhuma loja encontrada com o termo pesquisado." : "Nenhuma loja cadastrada."}
                  </TableCell></TableRow>
                )}
                {filteredStores.map((store) => (
                  <TableRow key={store.id} data-state={selectedStoreIds.has(store.id) ? "selected" : ""}>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                       <Checkbox
                        checked={selectedStoreIds.has(store.id)}
                        onCheckedChange={() => handleSelectStore(store.id)}
                        aria-label={`Selecionar loja ${store.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.code}</TableCell>
                    <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.name}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                        <div className="flex items-center gap-1">
                            {store.isMatrix ? "Matriz" : <Building size={14} className="text-muted-foreground" title={`Filial de ${stores.find(m => m.id === store.matrixStoreId)?.code || 'N/A'}`}/>}
                            {!store.isMatrix && (stores.find(m => m.id === store.matrixStoreId)?.code || '')}
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{formatDisplayCNPJ(store.cnpj)}</TableCell>
                    <TableCell className="hidden lg:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 break-words">{store.email || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.city || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{getDisplayState(store.state)}</TableCell>
                    <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 text-center">
                      <Switch
                        checked={store.isCheckedIn}
                        onCheckedChange={(checked) => handleToggleCheckIn(store.id, checked)}
                        aria-label={`Marcar check-in para ${store.name}`}
                        disabled={!store.participating}
                        title={!store.participating ? "Loja não participante" : (store.isCheckedIn ? "Desfazer Check-in" : "Confirmar Check-in")}
                      />
                    </TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                      <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleView(store)}>
                        <Eye className="h-4 w-4" /><span className="sr-only">Visualizar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(store)}>
                        <Edit className="h-4 w-4" /><span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(store.id)}>
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

