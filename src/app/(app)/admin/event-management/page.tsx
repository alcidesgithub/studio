
// src/app/(app)/admin/event-management/page.tsx
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { loadEvent, saveEvent } from '@/lib/localStorageUtils';
import type { Event } from '@/types';
import { Edit3, CalendarIcon, Save, UploadCloud, FileText, Trash2, Download, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';

const eventFormSchema = z.object({
  name: z.string().min(5, { message: "Nome do evento deve ter pelo menos 5 caracteres." }),
  date: z.date({ required_error: "Data do evento é obrigatória." }),
  time: z.string().min(1, { message: "Horário do evento é obrigatório." }),
  location: z.string().min(5, { message: "Localização deve ter pelo menos 5 caracteres." }),
  address: z.string().min(10, { message: "Endereço deve ter pelo menos 10 caracteres." }),
  mapEmbedUrl: z.string().url({ message: "Por favor, insira uma URL válida para o mapa." }).or(z.literal("")),
  vendorGuideUrl: z.string().optional(),
  associateGuideUrl: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AdminEventManagementPage() {
  const { toast } = useToast();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [selectedVendorGuideName, setSelectedVendorGuideName] = useState<string | null>(null);
  const [selectedAssociateGuideName, setSelectedAssociateGuideName] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    // Default values will be set in useEffect
  });

  useEffect(() => {
    const loadedEvent = loadEvent();
    setCurrentEvent(loadedEvent);
    const eventDate = loadedEvent.date && isValid(parseISO(loadedEvent.date)) ? parseISO(loadedEvent.date) : new Date();
    form.reset({
      name: loadedEvent.name,
      date: eventDate,
      time: loadedEvent.time,
      location: loadedEvent.location,
      address: loadedEvent.address,
      mapEmbedUrl: loadedEvent.mapEmbedUrl,
      vendorGuideUrl: loadedEvent.vendorGuideUrl || '',
      associateGuideUrl: loadedEvent.associateGuideUrl || '',
    });
    // If there are existing URLs, we might want to display a placeholder name or allow download
    // For simplicity, we'll just show a download link if URL exists
    if (loadedEvent.vendorGuideUrl) setSelectedVendorGuideName("Guia do Fornecedor Existente");
    if (loadedEvent.associateGuideUrl) setSelectedAssociateGuideName("Guia do Associado Existente");

  }, [form]);

  const handleFileChange = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof EventFormValues,
    setNameState: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Arquivo Inválido", description: "Por favor, selecione um arquivo PDF.", variant: "destructive" });
        event.target.value = ""; // Clear the input
        return;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        form.setValue(fieldName, dataUrl, { shouldValidate: true });
        setNameState(file.name);
        toast({ title: "Arquivo Carregado", description: `${file.name} pronto para salvar.`, variant: "success" });
      } catch (error) {
        toast({ title: "Erro ao Ler Arquivo", description: "Não foi possível carregar o arquivo.", variant: "destructive" });
        setNameState(null);
      }
    } else {
      // If no file is selected (e.g., user cancels file dialog), keep existing or clear if intended
      // form.setValue(fieldName, currentEvent?.[fieldName] || '', { shouldValidate: true }); // Keep existing if not replaced
      // setNameState(currentEvent?.[fieldName] ? `Guia Existente (${fieldName === 'vendorGuideUrl' ? 'Fornecedor' : 'Associado'})` : null);
    }
  }, [form, toast]);

  const handleRemoveGuide = useCallback((
    fieldName: 'vendorGuideUrl' | 'associateGuideUrl',
    setNameState: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    form.setValue(fieldName, '', { shouldValidate: true });
    setNameState(null);
    toast({ title: "Guia Removido", description: "O guia será removido ao salvar.", variant: "default" });
  }, [form, toast]);


  const onSubmit = (data: EventFormValues) => {
    const eventToSave: Event = {
      ...(currentEvent as Event), // Keep ID and any other non-form fields
      name: data.name,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      location: data.location,
      address: data.address,
      mapEmbedUrl: data.mapEmbedUrl,
      vendorGuideUrl: data.vendorGuideUrl,
      associateGuideUrl: data.associateGuideUrl,
    };
    saveEvent(eventToSave);
    setCurrentEvent(eventToSave); 
    
    // Reset file display names based on what was just saved
    setSelectedVendorGuideName(eventToSave.vendorGuideUrl ? "Guia do Fornecedor Salvo" : null);
    setSelectedAssociateGuideName(eventToSave.associateGuideUrl ? "Guia do Associado Salvo" : null);
    
    toast({
      title: "Configurações do Evento Salvas!",
      description: "Os detalhes do evento foram atualizados com sucesso.",
      variant: "success",
    });
  };

  if (!currentEvent) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const currentVendorGuideUrl = form.watch("vendorGuideUrl");
  const currentAssociateGuideUrl = form.watch("associateGuideUrl");

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciar evento"
        description="Edite os detalhes principais do evento e faça upload dos guias em PDF."
        icon={Edit3}
        iconClassName="text-secondary"
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Detalhes do Evento</CardTitle>
              <CardDescription>Atualize as informações que aparecem na página pública do evento.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Evento</FormLabel><FormControl><Input placeholder="Ex: Encontro Anual Hiperfarma" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data do Evento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Horário do Evento</FormLabel><FormControl><Input placeholder="Ex: 09:00 - 18:00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Nome do Local</FormLabel><FormControl><Input placeholder="Ex: Expo Center Norte" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço Completo</FormLabel><FormControl><Input placeholder="Ex: R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mapEmbedUrl" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>URL de Incorporação do Google Maps</FormLabel><FormControl><Textarea placeholder="Cole a URL src do iframe do Google Maps aqui" {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Guias do Evento (PDF)</CardTitle>
              <CardDescription>Faça upload dos guias para fornecedores e associados.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <FormItem>
                <FormLabel>Guia do Fornecedor (PDF)</FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf" className="h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" onChange={(e) => handleFileChange(e, 'vendorGuideUrl', setSelectedVendorGuideName)} />
                </FormControl>
                {(selectedVendorGuideName || currentVendorGuideUrl) && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate" title={selectedVendorGuideName || "Guia Atual"}>{selectedVendorGuideName || "Guia do Fornecedor Atual"}</span>
                      {currentVendorGuideUrl && 
                        <a href={currentVendorGuideUrl} target="_blank" rel="noopener noreferrer" download="Guia_Fornecedor.pdf" className="ml-1 text-primary hover:underline"><Download className="h-3 w-3 inline" /></a>}
                    </div>
                    {currentVendorGuideUrl &&
                    <Button type="button" variant="ghost" size="sm" className="h-auto p-1 text-destructive hover:text-destructive/80" onClick={() => handleRemoveGuide('vendorGuideUrl', setSelectedVendorGuideName)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                    </Button>}
                  </div>
                )}
                <FormMessage>{form.formState.errors.vendorGuideUrl?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Guia do Associado (PDF)</FormLabel>
                <FormControl>
                   <Input type="file" accept=".pdf" className="h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" onChange={(e) => handleFileChange(e, 'associateGuideUrl', setSelectedAssociateGuideName)} />
                </FormControl>
                 {(selectedAssociateGuideName || currentAssociateGuideUrl) && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate" title={selectedAssociateGuideName || "Guia Atual"}>{selectedAssociateGuideName || "Guia do Associado Atual"}</span>
                        {currentAssociateGuideUrl && 
                        <a href={currentAssociateGuideUrl} target="_blank" rel="noopener noreferrer" download="Guia_Associado.pdf" className="ml-1 text-primary hover:underline"><Download className="h-3 w-3 inline" /></a>}
                    </div>
                    {currentAssociateGuideUrl &&
                    <Button type="button" variant="ghost" size="sm" className="h-auto p-1 text-destructive hover:text-destructive/80" onClick={() => handleRemoveGuide('associateGuideUrl', setSelectedAssociateGuideName)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                    </Button>}
                  </div>
                )}
                <FormMessage>{form.formState.errors.associateGuideUrl?.message}</FormMessage>
              </FormItem>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
