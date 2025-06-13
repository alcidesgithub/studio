
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Save, UserPlus, Edit, Trash2, PlusCircle, Users, UploadCloud, FileText, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { STATES } from '@/lib/constants';
import { loadVendors, saveVendors, loadSalespeople, saveSalespeople, loadUsers, saveUsers } from '@/lib/localStorageUtils';
import type { Vendor, Salesperson, User } from '@/types';
import Image from 'next/image';

const vendorSchema = z.object({
  name: z.string().min(3, "Razão Social da empresa deve ter pelo menos 3 caracteres."),
  cnpj: z.string().refine(value => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 14;
  }, { message: "CNPJ deve ter 14 dígitos (após remover formatação)." }),
  address: z.string().min(5, "Endereço é obrigatório."),
  city: z.string().min(2, "Município é obrigatório."),
  neighborhood: z.string().min(2, "Bairro é obrigatório."),
  state: z.string().min(2, "Estado é obrigatório."),
  logoUrl: z.string().url("Deve ser uma URL válida para o logo."),
});
type VendorFormValues = z.infer<typeof vendorSchema>;

const salespersonSchema = z.object({
  name: z.string().min(3, "Nome do vendedor é obrigatório."),
  phone: z.string().min(10, "Telefone é obrigatório."),
  email: z.string().email("Endereço de email inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").optional(),
});
type SalespersonFormValues = z.infer<typeof salespersonSchema>;

const formatCNPJ = (cnpj: string = '') => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj; // Return original or partially formatted if not 14 digits
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const cleanCNPJ = (cnpj: string = '') => {
    return cnpj.replace(/\D/g, '');
};

// Helper function to parse CSV content
// Expected headers: name,cnpj,address,city,neighborhood,state,logoUrl
function parseCSVToVendors(csvText: string): { data: Partial<VendorFormValues>[], errors: string[] } {
    const allLines = csvText.trim().split(/\r\n|\n/);
    if (allLines.length < 2) {
        return { data: [], errors: ["Arquivo CSV vazio ou sem dados."] };
    }

    const headerLine = allLines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim());
    const expectedHeaders = ["name", "cnpj", "address", "city", "neighborhood", "state", "logourl"];
    const headerMap: Record<string, keyof VendorFormValues> = {
        "name": "name", "cnpj": "cnpj", "address": "address", 
        "city": "city", "neighborhood": "neighborhood", "state": "state", "logourl": "logoUrl"
    };
    
    const missingHeaders = Object.keys(headerMap).filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
        return { data: [], errors: [`Cabeçalhos faltando no CSV: ${missingHeaders.join(', ')}. Certifique-se que a primeira linha contém: ${Object.keys(headerMap).join(', ')}`] };
    }

    const vendorsData: Partial<VendorFormValues>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line.trim()) continue; 

        const values = line.split(',').map(v => v.trim());
        const vendorRow: Partial<VendorFormValues> = {};
        let hasErrorInRow = false;

        headers.forEach((header, index) => {
            const mappedKey = headerMap[header];
            if (mappedKey) {
                (vendorRow as any)[mappedKey] = values[index];
            }
        });
        
        if (vendorRow.cnpj) {
            vendorRow.cnpj = formatCNPJ(vendorRow.cnpj); 
        } else {
            errors.push(`Linha ${i + 1}: CNPJ não fornecido.`);
            hasErrorInRow = true;
        }
         if (!vendorRow.name) {
            errors.push(`Linha ${i + 1}: Nome do fornecedor não fornecido.`);
            hasErrorInRow = true;
        }


        if (!hasErrorInRow) {
            vendorsData.push(vendorRow);
        }
    }
    return { data: vendorsData, errors };
}


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

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    setVendors(loadVendors());
    setSalespeople(loadSalespeople());
  }, []);

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '', cnpj: '', address: '', city: '', neighborhood: '', state: '',
      logoUrl: 'https://placehold.co/120x60.png?text=Logo',
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
      logoUrl: 'https://placehold.co/120x60.png?text=NovoLogo',
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
    });
    setIsVendorDialogOpen(true);
  };

  const confirmDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
  };

  const handleDeleteVendor = () => {
    if (!vendorToDelete) return;
    const currentUsers = loadUsers();
    let usersModified = false;
    const salespeopleOfVendor = salespeople.filter(sp => sp.vendorId === vendorToDelete.id);
    const updatedSalespeople = salespeople.filter(sp => sp.vendorId !== vendorToDelete.id);
    const emailsOfSalespeopleToDelete = salespeopleOfVendor.map(sp => sp.email);
    const usersToKeep = currentUsers.filter(u => !(emailsOfSalespeopleToDelete.includes(u.email) && u.role === 'vendor'));
    if (usersToKeep.length < currentUsers.length) usersModified = true;
    
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);
    if(usersModified) saveUsers(usersToKeep);

    const updatedVendors = vendors.filter(v => v.id !== vendorToDelete.id);
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    toast({
      title: "Fornecedor Excluído!",
      description: `O fornecedor "${vendorToDelete.name}" e seus vendedores (e logins) vinculados foram removidos.`,
      variant: "destructive"
    });
    setVendorToDelete(null); 
  };

  const onVendorSubmit = (data: VendorFormValues) => {
    let updatedVendors;
    const rawCnpj = cleanCNPJ(data.cnpj);

    if (editingVendor) {
      updatedVendors = vendors.map(v =>
        v.id === editingVendor.id ? { ...editingVendor, ...data, cnpj: rawCnpj } : v
      );
      toast({ title: "Fornecedor Atualizado!", description: `${data.name} foi atualizado.` });
    } else {
      const newVendorId = `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
      const newVendor: Vendor = { id: newVendorId, ...data, cnpj: rawCnpj };
      updatedVendors = [...vendors, newVendor];
      setEditingVendor(newVendor); 
      toast({ title: "Fornecedor Cadastrado!", description: `${data.name} foi cadastrado. Você pode adicionar vendedores agora.` });
    }
    setVendors(updatedVendors);
    saveVendors(updatedVendors);
    
    if (!editingVendor) { /* Dialog stays open */ } 
    else { 
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
    salespersonForm.reset({ name: salesperson.name, phone: salesperson.phone, email: salesperson.email, password: '' });
    setIsSalespersonDialogOpen(true);
  };

  const confirmDeleteSalesperson = (salesperson: Salesperson) => {
    setSalespersonToDelete(salesperson);
  };

  const handleDeleteSalesperson = () => {
    if (!salespersonToDelete) return;
    const currentUsers = loadUsers();
    const usersToKeep = currentUsers.filter(u => !(u.email === salespersonToDelete.email && u.role === 'vendor'));
    if (usersToKeep.length < currentUsers.length) {
        saveUsers(usersToKeep);
        toast({ title: "Login do Vendedor Removido", description: `O login para ${salespersonToDelete.email} foi removido.`, variant: "info" });
    }
    const updatedSalespeople = salespeople.filter(sp => sp.id !== salespersonToDelete.id);
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);
    toast({ title: "Vendedor Excluído!", description: `O vendedor "${salespersonToDelete.name}" foi removido.`, variant: "destructive" });
    setSalespersonToDelete(null); 
  };

  const onSalespersonSubmit = (data: SalespersonFormValues) => {
    if (!currentVendorIdForSalesperson) return;
    const vendorForSalesperson = vendors.find(v => v.id === currentVendorIdForSalesperson);
    if (!vendorForSalesperson) return;

    let updatedSalespeople;
    if (editingSalesperson) {
        updatedSalespeople = salespeople.map(sp => sp.id === editingSalesperson.id ? { ...editingSalesperson, ...data, vendorId: currentVendorIdForSalesperson } : sp );
        toast({ title: "Vendedor Atualizado!", description: `${data.name} atualizado.` });
    } else {
        const newSalesperson: Salesperson = { id: `sp_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, ...data, vendorId: currentVendorIdForSalesperson };
        updatedSalespeople = [...salespeople, newSalesperson];
        toast({ title: "Vendedor Cadastrado!", description: `${data.name} cadastrado para ${vendorForSalesperson.name}.` });
    }
    setSalespeople(updatedSalespeople);
    saveSalespeople(updatedSalespeople);

    const currentUsers = loadUsers();
    const userIndex = currentUsers.findIndex(u => u.email === data.email);
    if (userIndex > -1) { 
      currentUsers[userIndex].name = data.name; 
      currentUsers[userIndex].role = 'vendor'; 
      currentUsers[userIndex].storeName = vendorForSalesperson.name;
    } else { 
      if (data.password) {
        const newUserForSalesperson: User = { id: `user_vendor_${Date.now()}_${Math.random().toString(36).substring(2,5)}`, email: data.email, role: 'vendor', name: data.name, storeName: vendorForSalesperson.name };
        currentUsers.push(newUserForSalesperson);
        toast({ title: "Login do Vendedor Criado!", description: `Um login foi criado para ${data.email}.`});
      } else if (!editingSalesperson) {
        toast({ title: "Senha Necessária", description: `Usuário (login) para ${data.email} não foi criado.`, variant: "destructive"});
      }
    }
    saveUsers(currentUsers);
    salespersonForm.reset();
    setIsSalespersonDialogOpen(false);
    setEditingSalesperson(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvFileName(file.name);
      setImportErrors([]); 
    } else {
      setCsvFile(null);
      setCsvFileName("");
    }
  };

  const handleProcessImport = async () => {
    if (!csvFile) {
      toast({ title: "Nenhum arquivo selecionado", description: "Por favor, selecione um arquivo CSV.", variant: "destructive" });
      return;
    }
    setImportLoading(true);
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const { data: parsedVendors, errors: parsingErrors } = parseCSVToVendors(text);

      if (parsingErrors.length > 0) {
        setImportErrors(parsingErrors);
        setImportLoading(false);
        toast({ title: "Erro ao Ler CSV", description: "Verifique os erros listados e o formato do arquivo.", variant: "destructive" });
        return;
      }

      const currentVendors = loadVendors();
      const newVendorsToSave: Vendor[] = [];
      const validationErrors: string[] = [];
      let importedCount = 0;

      for (let i = 0; i < parsedVendors.length; i++) {
        const pv = parsedVendors[i];
        try {
          
          const validatedData = vendorSchema.parse({
            name: pv.name || '',
            cnpj: pv.cnpj || '', 
            address: pv.address || '',
            city: pv.city || '',
            neighborhood: pv.neighborhood || '',
            state: pv.state || '',
            logoUrl: pv.logoUrl || 'https://placehold.co/120x60.png?text=Import',
          });
          
          const rawCsvCnpj = cleanCNPJ(pv.cnpj || '');
          if (currentVendors.some(v => v.cnpj === rawCsvCnpj) || newVendorsToSave.some(v => v.cnpj === rawCsvCnpj)) {
            validationErrors.push(`Linha ${i + 2}: CNPJ ${pv.cnpj} já existe e foi ignorado.`);
            continue;
          }

          newVendorsToSave.push({
            id: `vendor_${Date.now()}_${Math.random().toString(36).substring(2,7)}_${i}`,
            ...validatedData,
            cnpj: rawCsvCnpj, 
          });
          importedCount++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldErrors = error.errors.map(err => `Linha ${i + 2} (${pv.name || 'Sem nome'}): ${err.path.join('.')} - ${err.message}`).join('; ');
            validationErrors.push(fieldErrors);
          } else {
            validationErrors.push(`Linha ${i + 2} (${pv.name || 'Sem nome'}): Erro inesperado - ${(error as Error).message}`);
          }
        }
      }

      if (newVendorsToSave.length > 0) {
        const updatedVendorList = [...currentVendors, ...newVendorsToSave];
        saveVendors(updatedVendorList);
        setVendors(updatedVendorList);
      }
      
      setImportErrors(validationErrors);
      setImportLoading(false);

      if (importedCount > 0 && validationErrors.length === 0) {
        toast({ title: "Importação Concluída!", description: `${importedCount} fornecedores importados com sucesso.` });
        setIsImportDialogOpen(false);
        setCsvFile(null);
        setCsvFileName("");
      } else if (importedCount > 0 && validationErrors.length > 0) {
        toast({ title: "Importação Parcial", description: `${importedCount} fornecedores importados. Alguns registros tiveram erros.`, variant: "default" });
      } else if (importedCount === 0 && validationErrors.length > 0) {
        toast({ title: "Falha na Importação", description: "Nenhum fornecedor importado devido a erros. Verifique os detalhes.", variant: "destructive" });
      } else if (importedCount === 0 && validationErrors.length === 0 && parsedVendors.length > 0) {
        toast({ title: "Nenhum Novo Fornecedor", description: "Nenhum novo fornecedor para importar (possivelmente todos já existem).", variant: "default" });
      } else {
         toast({ title: "Nenhum dado para importar", description: "O arquivo CSV parece não conter dados de fornecedores válidos.", variant: "default" });
      }
    };
    reader.onerror = () => {
      toast({ title: "Erro ao ler arquivo", description: "Não foi possível ler o arquivo selecionado.", variant: "destructive" });
      setImportLoading(false);
    };
    reader.readAsText(csvFile);
  };

  const handleDownloadSampleCSV = () => {
    const csvHeader = "name,cnpj,address,city,neighborhood,state,logoUrl\n";
    const csvExampleRow1 = `"Exemplo Fornecedor Ltda.","12345678000199","Rua Exemplo, 123","Exemplópolis","Centro","SP","https://placehold.co/120x60.png?text=Exemplo1"\n`;
    const csvExampleRow2 = `"Outro Fornecedor S.A.","98765432000100","Avenida Modelo, 456","Modelândia","Bairro Novo","PR","https://placehold.co/120x60.png?text=Exemplo2"\n`;
    const csvContent = csvHeader + csvExampleRow1 + csvExampleRow2;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "exemplo_fornecedores.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const salespeopleForCurrentEditingVendor = useMemo(() => {
    if (!editingVendor) return [];
    return salespeople.filter(sp => sp.vendorId === editingVendor.id);
  }, [salespeople, editingVendor]);

  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8">
      <PageHeader
        title="Fornecedores"
        description="Adicione, edite ou remova fornecedores e gerencie seus vendedores."
        icon={Briefcase}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Importar (CSV)
            </Button>
            <Button onClick={handleAddNewVendor} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fornecedor
            </Button>
          </div>
        }
      />

      {/* Vendor Edit/Add Dialog */}
      <Dialog open={isVendorDialogOpen} onOpenChange={(isOpen) => {
          setIsVendorDialogOpen(isOpen);
          if (!isOpen) { setEditingVendor(null); vendorForm.reset(); }
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
            <DialogDescription>{editingVendor ? 'Atualize os detalhes e gerencie vendedores.' : 'Preencha os detalhes.'}</DialogDescription>
          </DialogHeader>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-3 sm:space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              <Card>
                <CardHeader><CardTitle className="text-lg sm:text-xl">Informações do Fornecedor</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
                  <FormField control={vendorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Ex: Soluções Farmacêuticas Ltda." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value ? formatCNPJ(field.value) : ''} onChange={e => field.onChange(formatCNPJ(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Ex: Rua das Indústrias, 789" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="city" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input placeholder="Ex: Curitiba" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Fanny" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl><SelectContent>{STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={vendorForm.control} name="logoUrl" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>URL do Logo</FormLabel><FormControl><Input type="url" placeholder="https://example.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
              {editingVendor && ( 
                <Card className="mt-4 sm:mt-6">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div><CardTitle className="text-lg sm:text-xl flex items-center gap-2"><Users /> Vendedores Associados</CardTitle><CardDescription>Gerencie os vendedores.</CardDescription></div>
                    <Button type="button" size="sm" onClick={() => handleAddNewSalesperson(editingVendor.id)} className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" /> Adicionar Vendedor</Button>
                  </CardHeader>
                  <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
                    {salespeopleForCurrentEditingVendor.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table><TableHeader><TableRow>
                            <TableHead className="px-2 py-3 sm:px-4">Nome</TableHead>
                            <TableHead className="px-2 py-3 sm:px-4">Email (Login)</TableHead>
                            <TableHead className="px-2 py-3 sm:px-4">Telefone</TableHead>
                            <TableHead className="text-right px-2 py-3 sm:px-4">Ações</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>{salespeopleForCurrentEditingVendor.map(sp => (
                            <TableRow key={sp.id}>
                                <TableCell className="px-2 py-3 sm:px-4">{sp.name}</TableCell>
                                <TableCell className="px-2 py-3 sm:px-4 break-words">{sp.email}</TableCell>
                                <TableCell className="px-2 py-3 sm:px-4">{sp.phone}</TableCell>
                                <TableCell className="text-right px-2 py-3 sm:px-4">
                                    <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEditSalesperson(sp)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => confirmDeleteSalesperson(sp)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}</TableBody>
                      </Table>
                      </div>
                    ) : (<p className="text-sm text-muted-foreground text-center py-4">Nenhum vendedor cadastrado.</p>)}
                  </CardContent>
                </Card>)}
              <DialogFooter className="pt-3 sm:pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setIsVendorDialogOpen(false); setEditingVendor(null); vendorForm.reset();}}>Fechar</Button></DialogClose>
                <Button type="submit" disabled={vendorForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingVendor ? 'Salvar Alterações' : 'Cadastrar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

       {/* Salesperson Edit/Add Dialog */}
      <Dialog open={isSalespersonDialogOpen} onOpenChange={(isOpen) => {
          setIsSalespersonDialogOpen(isOpen);
          if (!isOpen) { setEditingSalesperson(null); salespersonForm.reset(); }
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingSalesperson ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
                <DialogDescription>{editingSalesperson ? `Atualize ${editingSalesperson.name}.` : `Adicione para ${vendors.find(v => v.id === currentVendorIdForSalesperson)?.name || ''}.`}</DialogDescription>
            </DialogHeader>
            <Form {...salespersonForm}>
                <form onSubmit={salespersonForm.handleSubmit(onSalespersonSubmit)} className="space-y-3 sm:space-y-4 py-4">
                    <FormField control={salespersonForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Vendedor(a)</FormLabel><FormControl><Input placeholder="Ex: Ana Beatriz" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email de Login</FormLabel><FormControl><Input type="email" placeholder="vendas.login@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={salespersonForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha de Login {editingSalesperson ? '(Não alterar)' : ''}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter className="pt-3 sm:pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={salespersonForm.formState.isSubmitting}><Save className="mr-2 h-4 w-4" /> {editingSalesperson ? 'Salvar' : 'Cadastrar'}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* Vendor Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(isOpen) => {
        setIsImportDialogOpen(isOpen);
        if (!isOpen) {
          setCsvFile(null);
          setCsvFileName("");
          setImportErrors([]);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar Fornecedores (CSV)</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV para importar fornecedores em massa.
              O arquivo deve conter as seguintes colunas na primeira linha (cabeçalho):
              <code className="block bg-muted p-2 rounded-md my-2 text-xs break-all">name,cnpj,address,city,neighborhood,state,logoUrl</code>
              Certifique-se que o CNPJ esteja formatado corretamente ou apenas com números.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
             <div>
               <label htmlFor="csv-upload" className="block text-sm font-medium mb-1">Arquivo CSV</label>
              <Input 
                id="csv-upload"
                type="file" 
                accept=".csv" 
                onChange={handleFileSelect} 
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {csvFileName && (
              <div className="text-sm text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Arquivo selecionado: {csvFileName}
              </div>
            )}
            <Button type="button" variant="link" size="sm" onClick={handleDownloadSampleCSV} className="p-0 h-auto text-primary text-xs sm:text-sm">
              <Download className="mr-1 h-3 w-3" /> Baixar CSV de Exemplo
            </Button>
            {importErrors.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <h4 className="font-semibold text-destructive mb-2">Erros na Importação:</h4>
                <ul className="list-disc list-inside text-xs text-destructive space-y-1">
                  {importErrors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleProcessImport} disabled={!csvFile || importLoading}>
              {importLoading ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {importLoading ? 'Importando...' : 'Importar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Alert Dialogs for Deletion Confirmation */}
      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Excluir "{vendorToDelete?.name}"? Esta ação também removerá vendedores e logins vinculados.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setVendorToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteVendor} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!salespersonToDelete} onOpenChange={(open) => !open && setSalespersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Excluir "{salespersonToDelete?.name}"? O login associado também será removido.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setSalespersonToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSalesperson} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Table of Vendors */}
      <Card className="shadow-lg mt-6 sm:mt-8">
        <CardHeader className="px-4 py-5 sm:p-6">
            <CardTitle>Fornecedores Cadastrados</CardTitle>
            <CardDescription>Lista de todos os fornecedores no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] sm:w-[80px] px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Logo</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Razão Social</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">CNPJ</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Município</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Estado</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Vendedores</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-4 px-1.5 sm:px-2 md:px-3 lg:px-4">Nenhum fornecedor cadastrado.</TableCell></TableRow>)}
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4"><Image src={vendor.logoUrl} alt={`Logo ${vendor.name}`} width={60} height={30} className="object-contain rounded" /></TableCell>
                    <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{vendor.name}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{formatCNPJ(vendor.cnpj)}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{vendor.city}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{vendor.state}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{salespeople.filter(sp => sp.vendorId === vendor.id).length}</TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEditVendor(vendor)}><Edit className="h-4 w-4" /><span className="sr-only">Editar</span></Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => confirmDeleteVendor(vendor)}><Trash2 className="h-4 w-4" /><span className="sr-only">Excluir</span></Button>
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
    

    







