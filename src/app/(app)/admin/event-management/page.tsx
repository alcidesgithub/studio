
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
import { Edit3, CalendarIcon, Save, Link as LinkIcon, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

const eventFormSchema = z.object({
  name: z.string().min(5, { message: "Nome do evento deve ter pelo menos 5 caracteres." }),
  date: z.date({ required_error: "Data do evento é obrigatória." }),
  time: z.string().min(1, { message: "Horário do evento é obrigatório." }),
  location: z.string().min(5, { message: "Localização deve ter pelo menos 5 caracteres." }),
  address: z.string().min(10, { message: "Endereço deve ter pelo menos 10 caracteres." }),
  mapEmbedUrl: z.string().url({ message: "Por favor, insira uma URL válida para o mapa." }).or(z.literal("")),
  vendorGuideUrl: z.string().url({ message: "Por favor, insira uma URL válida para o Guia do Fornecedor." }).optional().or(z.literal("")),
  associateGuideUrl: z.string().url({ message: "Por favor, insira uma URL válida para o Guia do Associado." }).optional().or(z.literal("")),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AdminEventManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

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
  }, [form]);

  const handleRemoveGuideUrl = useCallback((fieldName: 'vendorGuideUrl' | 'associateGuideUrl') => {
    if (isManager) return;
    form.setValue(fieldName, '', { shouldValidate: true });
    toast({ title: "URL Removida", description: "A URL do guia será removida ao salvar.", variant: "default" });
  }, [form, toast, isManager]);

  const onSubmit = (data: EventFormValues) => {
    if (isManager) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar os detalhes do evento.",
        variant: "destructive"
      });
      return;
    }
    const eventToSave: Event = {
      ...(currentEvent || {}),
      id: currentEvent?.id || `event_${Date.now()}`,
      name: data.name,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      location: data.location,
      address: data.address,
      mapEmbedUrl: data.mapEmbedUrl,
      vendorGuideUrl: data.vendorGuideUrl,
      associateGuideUrl: data.associateGuideUrl,
    };
    
    const success = saveEvent(eventToSave);
    
    if (success) {
        setCurrentEvent(eventToSave); 
        toast({
          title: "Configurações do Evento Salvas!",
          description: "Os detalhes do evento foram atualizados com sucesso.",
          variant: "success",
        });
    } else {
        toast({
            title: "Falha ao Salvar",
            description: "Não foi possível salvar os detalhes do evento. O armazenamento local pode estar cheio ou ocorreu um erro inesperado.",
            variant: "destructive",
            duration: 9000,
        });
    }
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
        description={isManager ? "Visualizando detalhes do evento. A edição é permitida apenas para administradores." : "Edite os detalhes principais do evento e configure os links para os guias."}
        icon={Edit3}
        iconClassName="text-secondary"
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          <fieldset disabled={isManager}>
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
                <CardTitle>Links dos Guias do Evento</CardTitle>
                <CardDescription>Insira as URLs completas para os guias em PDF.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="vendorGuideUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Guia do Fornecedor (PDF)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="url" placeholder="https://example.com/guia-fornecedor.pdf" {...field} />
                          {field.value && (
                             <Button type="button" variant="ghost" size="icon" asChild>
                              <a href={field.value} target="_blank" rel="noopener noreferrer" title="Testar Link">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </FormControl>
                       {currentVendorGuideUrl &&
                          <Button type="button" variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-destructive hover:text-destructive/80" onClick={() => handleRemoveGuideUrl('vendorGuideUrl')}>
                            <Trash2 className="h-3 w-3 mr-1" /> Remover URL
                          </Button>
                        }
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="associateGuideUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Guia do Associado (PDF)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="url" placeholder="https://example.com/guia-associado.pdf" {...field} />
                          {field.value && (
                             <Button type="button" variant="ghost" size="icon" asChild>
                              <a href={field.value} target="_blank" rel="noopener noreferrer" title="Testar Link">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </FormControl>
                       {currentAssociateGuideUrl &&
                          <Button type="button" variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-destructive hover:text-destructive/80" onClick={() => handleRemoveGuideUrl('associateGuideUrl')}>
                            <Trash2 className="h-3 w-3 mr-1" /> Remover URL
                          </Button>
                        }
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isManager}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
