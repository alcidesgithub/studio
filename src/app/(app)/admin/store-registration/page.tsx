
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
import { Store as StoreIcon, Save, Edit, Trash2, PlusCircle, UploadCloud, FileText, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadStores, saveStores, loadUsers, saveUsers } from '@/lib/localStorageUtils'; 
import type { Store, User } from '@/types'; 

const storeRegistrationSchema = z.object({
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
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").optional(), 
});

type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

// For CSV parsing, allow more flexibility initially
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
  password?: string;
};


const formatCNPJ = (cnpj: string = '') => {
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

// Helper function to parse CSV content for Stores
function parseCSVToStores(csvText: string): { data: StoreCSVData[], errors: string[] } {
    const allLines = csvText.trim().split(/\r\n|\n/);
    if (allLines.length < 2) {
        return { data: [], errors: ["Arquivo CSV vazio ou sem dados."] };
    }

    const headerLine = allLines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim());
    const expectedHeaders = ["code", "razaosocial", "cnpj", "address", "city", "neighborhood", "state", "phone", "ownername", "responsiblename", "email", "password"];
    const headerMap: Record<string, keyof StoreCSVData> = {
        "code": "code", "razaosocial": "razaoSocial", "cnpj": "cnpj", "address": "address", 
        "city": "city", "neighborhood": "neighborhood", "state": "state", "phone": "phone",
        "ownername": "ownerName", "responsiblename": "responsibleName", "email": "email", "password": "password"
    };
    
    const missingHeaders = Object.keys(headerMap).filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
        return { data: [], errors: [`Cabeçalhos faltando no CSV: ${missingHeaders.join(', ')}. Certifique-se que a primeira linha contém: ${Object.keys(headerMap).join(', ')}`] };
    }

    const storesData: StoreCSVData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line.trim()) continue; 

        const values = line.split(',').map(v => v.trim());
        const storeRow: StoreCSVData = {};
        let hasErrorInRow = false;

        headers.forEach((header, index) => {
            const mappedKey = headerMap[header];
            if (mappedKey) {
                (storeRow as any)[mappedKey] = values[index];
            }
        });
        
        if (!storeRow.code || !storeRow.razaoSocial || !storeRow.cnpj || !storeRow.email) {
            errors.push(`Linha ${i + 1}: Dados essenciais (código, razão social, cnpj, email) faltando.`);
            hasErrorInRow = true;
        }


        if (!hasErrorInRow) {
            storesData.push(storeRow);
        }
    }
    return { data: storesData, errors };
}


export default function ManageStoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const [isImportStoreDialogOpen, setIsImportStoreDialogOpen] = useState(false);
  const [csvStoreFile, setCsvStoreFile] = useState<File | null>(null);
  const [csvStoreFileName, setCsvStoreFileName] = useState<string>("");
  const [importStoreLoading, setImportStoreLoading] = useState(false);
  const [importStoreErrors, setImportStoreErrors] = useState<string[]>([]);


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
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.reset({
      code: store.code,
      razaoSocial: store.name,
      cnpj: formatCNPJ(store.cnpj),
      address: store.address || '',
      city: store.city || '',
      neighborhood: store.neighborhood || '',
      state: store.state || undefined,
      phone: store.phone || '',
      ownerName: store.ownerName || '',
      responsibleName: store.responsibleName || '',
      email: store.email || '',
      password: '', 
    });
    setIsDialogOpen(true);
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
    };

    if (editingStore) {
      updatedStores = stores.map(s =>
        s.id === editingStore.id
          ? { ...s, ...storeDataToSave } : s
      );
      toast({
        title: "Loja Atualizada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi atualizada.`,
      });
    } else {
      const newStore: Store = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        ...storeDataToSave,
        participating: true, 
        goalProgress: 0,
        positivationsDetails: [],
      };
      updatedStores = [...stores, newStore];
      toast({
        title: "Loja Cadastrada!",
        description: `Loja ${data.code} - ${data.razaoSocial} foi cadastrada.`,
      });
    }
    setStores(updatedStores);
    saveStores(updatedStores);

    const currentUsers = loadUsers();
    const userIndex = currentUsers.findIndex(u => u.email === data.email);

    if (userIndex > -1) { 
      currentUsers[userIndex].name = data.responsibleName;
      currentUsers[userIndex].role = 'store';
      currentUsers[userIndex].storeName = data.razaoSocial;
    } else { 
      if (data.password) { 
        const newUserForStore: User = {
          id: `user_store_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
          email: data.email,
          role: 'store',
          name: data.responsibleName, 
          storeName: data.razaoSocial,
        };
        currentUsers.push(newUserForStore);
         toast({
          title: "Usuário da Loja Criado!",
          description: `Um login foi criado para ${data.email}.`,
        });
      } else if (!editingStore) {
         toast({
          title: "Senha Necessária para Novo Login",
          description: `Senha não fornecida. Usuário (login) para ${data.email} não foi criado.`,
          variant: "default"
        });
      }
    }
    saveUsers(currentUsers);

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
    const csvHeader = "code,razaoSocial,cnpj,address,city,neighborhood,state,phone,ownerName,responsibleName,email,password\n";
    const csvExampleRow1 = `"LJ998","Farmácia Exemplo Sul Ltda.","11222333000188","Rua Modelo Sul, 789","Curitiba","Portão","PR","(41) 99999-0001","Carlos Exemplo","Ana Modelo","loja.exsul@example.com","senha123"\n`;
    const csvExampleRow2 = `"LJ999","Drogaria Boa Saúde Oeste S.A.","44555666000199","Avenida Teste Oeste, 1011","Joinville","Centro","SC","(47) 98888-0002","Fernanda Teste","Ricardo Boa","loja.bsoeste@example.com","outrasenha"\n`;
    const csvContent = csvHeader + csvExampleRow1 + csvExampleRow2;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "exemplo_lojas.csv");
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
      const { data: parsedStores, errors: parsingErrors } = parseCSVToStores(text);

      if (parsingErrors.length > 0) {
        setImportStoreErrors(parsingErrors);
        setImportStoreLoading(false);
        toast({ title: "Erro ao Ler CSV", description: "Verifique os erros listados e o formato do arquivo.", variant: "destructive" });
        return;
      }

      const currentLocalStores = loadStores();
      const currentLocalUsers = loadUsers();
      const newStoresToSave: Store[] = [];
      const newUsersToSave: User[] = [];
      const validationErrors: string[] = [];
      let importedCount = 0;

      for (let i = 0; i < parsedStores.length; i++) {
        const ps = parsedStores[i];
        try {
          const cleanedCsvCnpj = cleanCNPJ(ps.cnpj || "");
          const storeInputData = {
            code: ps.code || "",
            razaoSocial: ps.razaoSocial || "",
            cnpj: cleanedCsvCnpj, // Pass cleaned CNPJ for Zod validation
            address: ps.address || "",
            city: ps.city || "",
            neighborhood: ps.neighborhood || "",
            state: ps.state || "",
            phone: ps.phone || "",
            ownerName: ps.ownerName || "",
            responsibleName: ps.responsibleName || "",
            email: ps.email || "",
            password: ps.password, // Optional
          };
          
          const validationResult = storeRegistrationSchema.safeParse(storeInputData);

          if (!validationResult.success) {
            const fieldErrors = validationResult.error.errors.map(err => `Linha ${i + 2} (Loja ${ps.code || 'sem código'}): ${err.path.join('.')} - ${err.message}`).join('; ');
            validationErrors.push(fieldErrors);
            continue;
          }
          
          const validatedData = validationResult.data;

          if (currentLocalStores.some(s => s.code === validatedData.code) || newStoresToSave.some(s => s.code === validatedData.code)) {
            validationErrors.push(`Linha ${i + 2}: Código de loja ${validatedData.code} já existe e foi ignorado.`);
            continue;
          }
          if (currentLocalStores.some(s => s.cnpj === validatedData.cnpj) || newStoresToSave.some(s => s.cnpj === validatedData.cnpj)) {
            validationErrors.push(`Linha ${i + 2}: CNPJ ${formatCNPJ(validatedData.cnpj)} já existe e foi ignorado.`);
            continue;
          }
          if (currentLocalUsers.some(u => u.email === validatedData.email && u.role === 'store') || newUsersToSave.some(u => u.email === validatedData.email && u.role === 'store')) {
             validationErrors.push(`Linha ${i + 2}: Email ${validatedData.email} já cadastrado para outra loja e foi ignorado.`);
            continue;
          }

          const newStore: Store = {
            id: `store_csv_${Date.now()}_${i}`,
            code: validatedData.code,
            name: validatedData.razaoSocial,
            cnpj: validatedData.cnpj, // Already cleaned by Zod
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
          };
          newStoresToSave.push(newStore);

          // User creation if email and password are provided and user doesn't exist
          const existingUser = currentLocalUsers.find(u => u.email === validatedData.email);
          if (!existingUser && validatedData.password) {
            const newUserForStore: User = {
              id: `user_store_csv_${Date.now()}_${i}`,
              email: validatedData.email,
              role: 'store',
              name: validatedData.responsibleName,
              storeName: validatedData.razaoSocial,
            };
            newUsersToSave.push(newUserForStore);
          }
          importedCount++;
        } catch (error) { // Catch any unexpected error during processing a row
            validationErrors.push(`Linha ${i + 2} (Loja ${ps.code || 'sem nome'}): Erro inesperado - ${(error as Error).message}`);
        }
      }

      if (newStoresToSave.length > 0) {
        const updatedStoreList = [...currentLocalStores, ...newStoresToSave];
        saveStores(updatedStoreList);
        setStores(updatedStoreList); // Update UI
      }
      if (newUsersToSave.length > 0) {
        const updatedUserList = [...currentLocalUsers, ...newUsersToSave];
        saveUsers(updatedUserList); 
        // No direct UI update needed here for users, but it's saved.
      }
      
      setImportStoreErrors(validationErrors);
      setImportStoreLoading(false);

      if (importedCount > 0 && validationErrors.length === 0) {
        toast({ title: "Importação Concluída!", description: `${importedCount} lojas importadas com sucesso.` });
        setIsImportStoreDialogOpen(false);
        setCsvStoreFile(null);
        setCsvStoreFileName("");
      } else if (importedCount > 0 && validationErrors.length > 0) {
        toast({ title: "Importação Parcial", description: `${importedCount} lojas importadas. Alguns registros tiveram erros.`, variant: "default" });
      } else if (importedCount === 0 && validationErrors.length > 0) {
        toast({ title: "Falha na Importação", description: "Nenhuma loja importada devido a erros. Verifique os detalhes.", variant: "destructive" });
      } else if (importedCount === 0 && validationErrors.length === 0 && parsedStores.length > 0) {
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


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Lojas"
        description="Adicione, edite ou remova lojas participantes."
        icon={StoreIcon}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsImportStoreDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Importar Lojas (CSV)
            </Button>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Loja
            </Button>
          </div>
        }
      />

      {/* Store Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Editar Loja' : 'Adicionar Nova Loja'}</DialogTitle>
            <DialogDescription>
              {editingStore ? 'Atualize os detalhes desta loja.' : 'Preencha os detalhes para a nova loja.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              <Card>
                <CardHeader><CardTitle className="text-lg sm:text-xl">Informações da Loja</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
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
                      <FormItem><FormLabel>Município</FormLabel><FormControl><Input placeholder="Ex: Curitiba" {...field} /></FormControl><FormMessage /></FormItem>
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
                <CardHeader><CardTitle className="text-lg sm:text-xl">Contato e Login (Usuário da Loja)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
                  <FormField control={form.control} name="ownerName" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Proprietário(a)</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="responsibleName" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Responsável (login sistema)</FormLabel><FormControl><Input placeholder="Ex: Maria Oliveira" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="loja.login@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Senha de Login {editingStore ? '(Deixe em branco para não alterar se o usuário já existir)' : ''}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </CardContent>
              </Card>
              <DialogFooter className="pt-3 sm:pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setEditingStore(null); form.reset(); setIsDialogOpen(false); }}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingStore ? 'Salvar Alterações' : 'Cadastrar Loja'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Store Import Dialog */}
      <Dialog open={isImportStoreDialogOpen} onOpenChange={(isOpen) => {
        setIsImportStoreDialogOpen(isOpen);
        if (!isOpen) {
          setCsvStoreFile(null);
          setCsvStoreFileName("");
          setImportStoreErrors([]);
        }
      }}>
        <DialogContent className="sm:max-w-xl"> {/* Increased max-width */}
          <DialogHeader>
            <DialogTitle>Importar Lojas (CSV)</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV para importar lojas em massa.
              A primeira linha (cabeçalho) deve conter:
              <code className="block bg-muted p-2 rounded-md my-2 text-xs break-all">code,razaoSocial,cnpj,address,city,neighborhood,state,phone,ownerName,responsibleName,email,password</code>
              O campo 'password' é usado para criar um novo login para a loja se o email não existir.
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
                className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {csvStoreFileName && (
              <div className="text-sm text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Arquivo selecionado: {csvStoreFileName}
              </div>
            )}
            <Button type="button" variant="link" size="sm" onClick={handleDownloadSampleStoreCSV} className="p-0 h-auto text-primary text-xs sm:text-sm">
              <Download className="mr-1 h-3 w-3" /> Baixar CSV de Exemplo para Lojas
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
              {importStoreLoading ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {importStoreLoading ? 'Importando...' : 'Importar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
          <CardDescription>Lista de todas as lojas no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Código</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Razão Social</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">CNPJ</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Email (Login)</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Município</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Estado</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-4 px-1.5 sm:px-2 md:px-3 lg:px-4">Nenhuma loja cadastrada.</TableCell></TableRow>
                )}
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.code}</TableCell>
                    <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.name}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{formatCNPJ(store.cnpj)}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 break-words">{store.email || 'N/A'}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{store.city || 'N/A'}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{getDisplayState(store.state)}</TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
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
    

    






