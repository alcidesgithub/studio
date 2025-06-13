
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadEvent, loadVendors } from '@/lib/localStorageUtils';
import type { Event, Vendor } from '@/types';
import { EventMap } from '@/components/event/EventMap';
import { CalendarDays, Clock, MapPin as MapPinIcon, Building, Users } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import Image from 'next/image';


export default function EventInfoPage() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setCurrentEvent(loadEvent());
    setVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  if (!currentEvent) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Informações do evento" icon={Building} />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Carregando informações do evento...
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = currentEvent.date && isValid(parseISO(currentEvent.date)) ? parseISO(currentEvent.date) : new Date();

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Informações do evento"
        description={`Detalhes para ${currentEvent.name}`}
        icon={Building}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl">{currentEvent.name}</CardTitle>
              <CardDescription>Tudo que você precisa saber sobre o evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Data</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Horário</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{currentEvent.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Localização</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{currentEvent.location}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground/80">{currentEvent.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <EventMap embedUrl={currentEvent.mapEmbedUrl} address={currentEvent.address} />
        </div>
      </div>

      <Card className="shadow-lg mt-8 sm:mt-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-headline">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Fornecedores Participantes
          </CardTitle>
          <CardDescription>Conheça os fornecedores que estarão presentes no evento.</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 place-items-center">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="p-2 sm:p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow w-full h-28 sm:h-32 flex flex-col items-center justify-center text-center">
                  <div className="relative w-full h-16 sm:h-20 mb-1">
                    <Image
                      src={vendor.logoUrl}
                      alt={`Logo ${vendor.name}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1 truncate w-full">{vendor.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum fornecedor participante cadastrado para este evento ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
