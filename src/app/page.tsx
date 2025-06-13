
"use client";

import { useEffect, useState } from 'react';
import { EventMap } from '@/components/event/EventMap';
import { loadEvent as loadEventClient, loadVendors as loadVendorsClient } from '@/lib/localStorageUtils';
import type { Event, Vendor } from '@/types';
import { CalendarDays, Clock, MapPin as MapPinIcon, Users, LogIn, Briefcase } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadedEvent = loadEventClient();
    setEvent(loadedEvent);
    if (loadedEvent) {
      if (loadedEvent.name) {
        document.title = `${loadedEvent.name} - Hiperfarma`;
      }
      if (loadedEvent.date && isValid(parseISO(loadedEvent.date))) {
        setCurrentYear(parseISO(loadedEvent.date).getFullYear());
      }
    } else {
      document.title = 'Encontro de Negócios Hiperfarma';
    }

    setVendors(loadVendorsClient().sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, []);

  if (isLoading || !event) {
    return (
      <div className="dark min-h-screen bg-background flex flex-col items-center animate-fadeIn p-4">
        <div className="container mx-auto px-4 text-center py-8 sm:py-12">
            <Skeleton className="h-16 w-48 mx-auto mb-6" />
            <Skeleton className="h-10 w-3/4 mx-auto mb-10" />
            <Skeleton className="h-8 w-40 mx-auto mb-10" />
        </div>
        <div className="container mx-auto px-4 py-8 sm:py-12 flex-grow w-full">
            <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full mb-8" />
        </div>
        <footer className="w-full bg-card/50 border-t border-border py-10 sm:py-16 mt-12">
            <div className="container mx-auto px-4 text-center">
                <Skeleton className="h-10 w-36 mx-auto mb-4" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
            </div>
        </footer>
      </div>
    );
  }

  const eventDate = event.date && isValid(parseISO(event.date)) ? parseISO(event.date) : new Date();

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col items-center font-body animate-fadeIn">
      <header className="w-full py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 sm:mb-10 flex justify-center">
            <Image
              src="https://i.imgur.com/qlwlELF.png"
              alt="Encontro de Negócios Hiperfarma"
              width={300}
              height={75}
              style={{ objectFit: "contain" }}
              data-ai-hint="event logo"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-10">
            {event.name}
          </h1>
          
          <Link href="/login">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-base sm:text-lg px-8 py-6 mb-10">
              <LogIn className="mr-2 h-5 w-5" /> Acessar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 flex-grow w-full">
        <section id="quando-onde-section" aria-labelledby="quando-onde-heading" className="mt-0 sm:mt-2 mb-12 sm:mb-16">
           <div className="relative text-center mb-8">
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-secondary/30"></div>
            <div className="absolute inset-x-0 top-[calc(50%+4px)] transform -translate-y-1/2 h-0.5 bg-accent/30"></div>
            <h2 id="quando-onde-heading" className="relative inline-block bg-background px-4 text-2xl sm:text-3xl font-semibold text-foreground uppercase tracking-wider">LOCALIZAÇÃO E DETALHES DO EVENTO</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 text-center">
            <div className="bg-accent/20 border border-accent/30 p-4 sm:p-6 rounded-lg">
              <CalendarDays className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1 uppercase text-foreground">DATA</h3>
              <p className="text-base text-white">{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 p-4 sm:p-6 rounded-lg">
              <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1 uppercase text-foreground">HORÁRIO</h3>
              <p className="text-base text-white">{event.time}</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 p-4 sm:p-6 rounded-lg">
              <MapPinIcon className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1 uppercase text-foreground">LOCAL</h3>
              <p className="text-base text-white">{event.location}</p>
            </div>
          </div>
          {event.mapEmbedUrl && event.mapEmbedUrl.trim() !== "" ? (
            <>
              <EventMap embedUrl={event.mapEmbedUrl} address={event.address} />
              <p className="text-center text-sm text-muted-foreground mt-4">{event.address}</p>
            </>
          ) : (
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow-xl border border-border text-center">
              <p className="text-muted-foreground">Mapa e endereço detalhado serão disponibilizados em breve.</p>
            </div>
          )}
        </section>
        
        {vendors.length > 0 && (
          <section id="fornecedores-section" aria-labelledby="fornecedores-heading" className="my-12 sm:my-16 py-10 sm:py-12 bg-accent/10 rounded-lg">
            <h2 id="fornecedores-heading" className="text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-10 text-accent uppercase tracking-wider">FORNECEDORES PARTICIPANTES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 items-center px-4">
              {vendors.map(vendor => (
                <div key={vendor.id} className="relative h-20 w-full">
                  <Image
                    src={vendor.logoUrl}
                    alt={vendor.name}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-full" 
                    data-ai-hint="vendor logo"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="w-full bg-card/50 border-t border-border py-10 sm:py-16 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
             <Image
              src="https://i.imgur.com/qlwlELF.png" 
              alt="Negócios Hiperfarma"
              width={180}
              height={45}
              style={{ objectFit: "contain" }}
              data-ai-hint="company logo small"
            />
          </div>
          <p className="text-xs text-muted-foreground">&copy; {currentYear} Rede Hiperfarma. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

