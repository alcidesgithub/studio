
"use client";

import { useEffect, useState } from 'react';
import { EventMap } from '@/components/event/EventMap';
import { loadEvent as loadEventClient, loadVendors as loadVendorsClient } from '@/lib/localStorageUtils'; 
// A importação de loadEventSSR e loadVendorsSSR não é mais necessária aqui, pois generateMetadata foi removido.
import type { Event, Vendor } from '@/types';
import { CalendarDays, Clock, MapPin as MapPinIcon, Users } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import type { Metadata } from 'next'; // Removido
import { Skeleton } from '@/components/ui/skeleton';

// A função generateMetadata foi removida pois não pode ser exportada de um client component.

export default function LandingPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Definindo o título da página dinamicamente no cliente, se desejado.
    // Isso é opcional, pois o título do layout.tsx será usado por padrão.
    const loadedEvent = loadEventClient();
    setEvent(loadedEvent);
    if (loadedEvent && loadedEvent.name) {
      document.title = `${loadedEvent.name} - Página Inicial`;
    } else {
      document.title = 'Hiperfarma Business Meeting Manager - Página Inicial';
    }
    
    setVendors(loadVendorsClient().sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, []);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-muted/40 flex flex-col items-center animate-fadeIn">
        <header className="w-full bg-primary text-primary-foreground py-8 shadow-lg">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6 flex justify-center">
               <Image
                src="https://i.imgur.com/qlwlELF.png"
                alt="Logo Encontro de Negócios Hiperfarma"
                width={300} 
                height={75} 
                priority 
                className="rounded-md"
                data-ai-hint="event logo"
              />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 flex-grow">
          <section className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
            <Skeleton className="h-8 w-3/4 mx-auto mb-6" />
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              {[1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center md:items-start">
                  <Skeleton className="h-12 w-12 mb-3" />
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Skeleton className="h-12 w-40 mx-auto" />
            </div>
          </section>
          <section className="mb-12">
            <Skeleton className="h-8 w-1/2 mx-auto mb-6" />
            <Skeleton className="h-[450px] w-full rounded-lg" />
          </section>
           <section className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
            <Skeleton className="h-8 w-3/4 mx-auto mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 place-items-center">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          </section>
        </main>
        <footer className="w-full bg-primary text-primary-foreground py-6 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Hiperfarma Business Meeting Manager. Todos os direitos reservados.</p>
        </footer>
      </div>
    );
  }

  const eventDate = event.date && isValid(parseISO(event.date)) ? parseISO(event.date) : new Date();

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center animate-fadeIn">
      <header className="w-full bg-primary text-primary-foreground py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="https://i.imgur.com/qlwlELF.png"
              alt="Logo Encontro de Negócios Hiperfarma"
              width={300} 
              height={75} 
              priority 
              className="rounded-md"
              data-ai-hint="event logo"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section id="event-details-section" aria-labelledby="event-details-heading" className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
          <h2 id="event-details-heading" className="text-3xl font-semibold mb-6 text-center text-primary font-headline">{event.name}</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <CalendarDays className="h-12 w-12 text-accent mb-3" />
              <h3 className="text-xl font-semibold mb-1">Data</h3>
              <p className="text-lg text-muted-foreground">{format(eventDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <Clock className="h-12 w-12 text-accent mb-3" />
              <h3 className="text-xl font-semibold mb-1">Horário</h3>
              <p className="text-lg text-muted-foreground">{event.time}</p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <MapPinIcon className="h-12 w-12 text-accent mb-3" />
              <h3 className="text-xl font-semibold mb-1">Localização</h3>
              <p className="text-lg text-muted-foreground">{event.location}</p>
              <p className="text-sm text-muted-foreground/80">{event.address}</p>
            </div>
          </div>
           <div className="mt-8 text-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/login">Acessar Plataforma</Link>
            </Button>
          </div>
        </section>

        <section id="map-section" aria-labelledby="map-heading" className="mb-12">
           <h2 id="map-heading" className="text-3xl font-semibold mb-6 text-center text-primary font-headline">Como Chegar</h2>
          <EventMap embedUrl={event.mapEmbedUrl} address={event.address} />
        </section>

        <section id="vendors-section" aria-labelledby="vendors-heading" className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
          <h2 id="vendors-heading" className="text-3xl font-semibold mb-8 text-center text-primary font-headline flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-accent"/>
            Fornecedores Participantes
          </h2>
          {vendors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 place-items-center">
              {vendors.map(vendor => (
                <div key={vendor.id} className="p-4 bg-background rounded-lg shadow-md hover:shadow-lg transition-shadow w-full h-full flex items-center justify-center">
                  <Image
                    src={vendor.logoUrl}
                    alt={vendor.name}
                    width={150}
                    height={80}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
            ) : (
                 <p className="col-span-full text-center text-muted-foreground py-4">Nenhum fornecedor participante cadastrado ainda.</p>
            )}
        </section>
      </main>

      <footer className="w-full bg-primary text-primary-foreground py-6 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} Hiperfarma Business Meeting Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
    
