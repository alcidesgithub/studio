
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { MOCK_EVENT } from '@/lib/constants'; // No longer use MOCK_EVENT
import { loadEvent } from '@/lib/localStorageUtils';
import type { Event } from '@/types';
import { EventMap } from '@/components/event/EventMap';
import { CalendarDays, Clock, MapPin as MapPinIcon, Building } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function EventInfoPage() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  useEffect(() => {
    setCurrentEvent(loadEvent());
  }, []);

  if (!currentEvent) {
    return (
      <div className="animate-fadeIn p-6">
        <PageHeader title="Informações do Evento" icon={Building} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
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
        title="Informações do Evento"
        description={`Detalhes para ${currentEvent.name}`}
        icon={Building}
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{currentEvent.name}</CardTitle>
              <CardDescription>Tudo que você precisa saber sobre o evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Data</h3>
                  <p className="text-muted-foreground">{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Horário</h3>
                  <p className="text-muted-foreground">{currentEvent.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Localização</h3>
                  <p className="text-muted-foreground">{currentEvent.location}</p>
                  <p className="text-xs text-muted-foreground/80">{currentEvent.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <EventMap embedUrl={currentEvent.mapEmbedUrl} address={currentEvent.address} />
        </div>
      </div>
    </div>
  );
}
