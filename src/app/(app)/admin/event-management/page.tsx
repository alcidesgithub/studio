
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { MOCK_EVENT, MOCK_VENDORS } from '@/lib/constants'; // No longer directly use MOCK_EVENT
import { loadEvent, saveEvent, loadVendors } from '@/lib/localStorageUtils';
import type { Event, Vendor } from '@/types';
import { Edit3, CalendarIcon, Save, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const eventFormSchema = z.object({
  name: z.string().min(5, { message: "Nome do evento deve ter pelo menos 5 caracteres." }),
  date: z.date({ required_error: "Data do evento é obrigatória." }),
  time: z.string().min(1, { message: "Horário do evento é obrigatório." }),
  location: z.string().min(5, { message: "Localização deve ter pelo menos 5 caracteres." }),
  address: z.string().min(10, { message: "Endereço deve ter pelo menos 10 caracteres." }),
  mapEmbedUrl: z.string().url({ message: "Por favor, insira uma URL válida para o mapa." }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AdminEventManagementPage() {
  const { toast } = useToast();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    // Default values will be set in useEffect after loading from local storage
  });

  useEffect(() => {
    const loadedEvent = loadEvent();
    setCurrentEvent(loadedEvent);
    setVendors(loadVendors());

    // Set form default values once event is loaded
    const eventDate = loadedEvent.date && isValid(parseISO(loadedEvent.date)) ? parseISO(loadedEvent.date) : new Date();
    form.reset({
      name: loadedEvent.name,
      date: eventDate,
      time: loadedEvent.time,
      location: loadedEvent.location,
      address: loadedEvent.address,
      mapEmbedUrl: loadedEvent.mapEmbedUrl,
    });
  }, [form]);

  const onSubmit = (data: EventFormValues) => {
    const eventToSave: Event = {
      ...(currentEvent as Event), // Keep ID and any other non-form fields
      ...data,
      date: format(data.date, 'yyyy-MM-dd'), // Store date as ISO string
    };
    saveEvent(eventToSave);
    setCurrentEvent(eventToSave); // Update state
    toast({
      title: "Configurações do Evento Salvas!",
      description: "Os detalhes do evento foram atualizados com sucesso no armazenamento local.",
    });
  };

  if (!currentEvent) {
    return <div>Carregando detalhes do evento...</div>; // Or a proper loader
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento do Evento"
        description="Edite os detalhes principais do evento de negócios."
        icon={Edit3}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Detalhes do Evento</CardTitle>
              <CardDescription>Atualize as informações que aparecem na página pública do evento.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Encontro Anual Hiperfarma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Evento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário do Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 09:00 - 18:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Expo Center Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mapEmbedUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>URL de Incorporação do Google Maps</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Cole a URL src do iframe do Google Maps aqui" {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> Fornecedores Participantes</CardTitle>
              <CardDescription>Esta lista é gerenciada via cadastro de fornecedores (lendo do armazenamento local).</CardDescription>
            </CardHeader>
            <CardContent>
              {vendors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Logo</TableHead>
                      <TableHead>Nome do Fornecedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Image
                            src={vendor.logoUrl}
                            alt={`Logo ${vendor.name}`}
                            width={60}
                            height={30}
                            className="object-contain rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Nenhum fornecedor cadastrado atualmente.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
