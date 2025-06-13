
"use client";

import { useEffect, useState } from 'react';
import { EventMap } from '@/components/event/EventMap';
import { loadEvent as loadEventClient, loadVendors as loadVendorsClient } from '@/lib/localStorageUtils';
import type { Event, Vendor } from '@/types';
import { CalendarDays, Clock, MapPin as MapPinIcon, Users, Building, Target, Trophy, Store, ArrowRight, Sparkles, Repeat, ChevronsRight, LogIn } from 'lucide-react';
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
        <Skeleton className="h-16 w-48 mx-auto my-8" />
        <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-40 w-full max-w-2xl mx-auto mb-8" />
        <Skeleton className="h-64 w-full max-w-4xl mx-auto" />
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
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">EM {currentYear}, CADA ENCONTRO TEM PROPÓSITO:</p>
          <div className="inline-block bg-accent text-accent-foreground font-semibold py-3 px-6 rounded-md text-xl sm:text-2xl md:text-3xl mb-6">
            <h1 className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 hidden sm:inline-block" />
              Conectar para Crescer & Negociar para Avançar.
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground mb-8">
            Participe do principal encontro de negócios do setor farmacêutico. Uma oportunidade única para networking, aprendizado e fechamento de grandes negócios. Prepare-se para inovar e expandir seus horizontes!
          </p>
          <Link href="/login" passHref legacyBehavior>
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-base sm:text-lg px-8 py-6 mb-10">
              <LogIn className="mr-2 h-5 w-5" /> Acessar Sistema
            </Button>
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 py-6 rounded-lg text-center">
              <Trophy className="h-10 w-10 text-accent mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold">+100MIL</div>
              <p className="text-sm text-accent">ATÉ EM PRÊMIOS</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 py-6 rounded-lg text-center">
              <Store className="h-10 w-10 text-accent mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold">+{vendors.length > 30 ? vendors.length : '40'}</div>
              <p className="text-sm text-accent">STANDS</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 py-6 rounded-lg text-center">
              <Users className="h-10 w-10 text-accent mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-bold">+700</div>
              <p className="text-sm text-accent">PARTICIPANTES</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 flex-grow w-full">

        <section id="mapa-stands-section" aria-labelledby="mapa-stands-heading" className="my-12 sm:my-16">
          <div className="relative text-center mb-8">
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-accent/30"></div>
            <div className="absolute inset-x-0 top-[calc(50%+4px)] transform -translate-y-1/2 h-0.5 bg-secondary/30"></div>
            <h2 id="mapa-stands-heading" className="relative inline-block bg-background px-4 text-2xl sm:text-3xl font-semibold text-foreground uppercase tracking-wider">MAPA DOS STANDS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow-xl border border-border">
              <h3 className="text-xl font-semibold mb-3 text-center text-accent">MAPA TÉRREO</h3>
              <Image src="https://placehold.co/600x400.png" alt="Mapa do Térreo" width={600} height={400} className="rounded-md mx-auto" data-ai-hint="floor plan ground"/>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow-xl border border-border">
              <h3 className="text-xl font-semibold mb-3 text-center text-accent">MAPA 1º ANDAR</h3>
              <Image src="https://placehold.co/600x400.png" alt="Mapa do Primeiro Andar" width={600} height={400} className="rounded-md mx-auto" data-ai-hint="floor plan first"/>
            </div>
          </div>
        </section>

        {vendors.length > 0 && (
          <section id="fornecedores-section" aria-labelledby="fornecedores-heading" className="my-12 sm:my-16 py-10 sm:py-12 bg-accent/10 rounded-lg">
            <h2 id="fornecedores-heading" className="text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-10 text-accent uppercase tracking-wider">FORNECEDORES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 items-center px-4">
              {vendors.map(vendor => (
                <div key={vendor.id} className="flex justify-center items-center h-20 p-2 bg-card/50 rounded shadow-md hover:shadow-lg transition-shadow">
                  <Image
                    src={vendor.logoUrl}
                    alt={vendor.name}
                    width={150}
                    height={80}
                    style={{ objectFit: "contain" }}
                    className="max-h-full max-w-full"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="galeria-section" aria-labelledby="galeria-heading" className="my-12 sm:my-16">
          <h2 id="galeria-heading" className="text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-10 text-foreground uppercase tracking-wider">NOSSA GALERIA</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 1", hint: "event team photo" },
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 2", hint: "speaker presentation" },
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 3", hint: "networking event" },
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 4", hint: "audience engagement" },
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 5", hint: "event stage" },
              { src: "https://placehold.co/400x300.png", alt: "Foto do evento 6", hint: "happy attendees" },
            ].map((img, index) => (
              <div key={index} className="aspect-w-4 aspect-h-3 relative">
                <Image src={img.src} alt={img.alt} layout="fill" objectFit="cover" className="rounded-lg shadow-lg" data-ai-hint={img.hint}/>
              </div>
            ))}
          </div>
           <p className="text-center text-sm text-muted-foreground mt-4">A galeria de fotos do evento de {currentYear}.</p>
        </section>

        <section id="quando-onde-section" aria-labelledby="quando-onde-heading" className="my-12 sm:my-16">
           <div className="relative text-center mb-8">
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-secondary/30"></div>
            <div className="absolute inset-x-0 top-[calc(50%+4px)] transform -translate-y-1/2 h-0.5 bg-accent/30"></div>
            <h2 id="quando-onde-heading" className="relative inline-block bg-background px-4 text-2xl sm:text-3xl font-semibold text-foreground uppercase tracking-wider">QUANDO & ONDE</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 text-center">
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 sm:p-6 rounded-lg">
              <CalendarDays className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1">DATA</h3>
              <p className="text-base">{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 sm:p-6 rounded-lg">
              <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1">HORÁRIO</h3>
              <p className="text-base">{event.time}</p>
            </div>
            <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 sm:p-6 rounded-lg">
              <MapPinIcon className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1">LOCAL</h3>
              <p className="text-base">{event.location}</p>
            </div>
          </div>
          <EventMap embedUrl={event.mapEmbedUrl} address={event.address} />
          <p className="text-center text-sm text-muted-foreground mt-4">{event.address}</p>
        </section>
      </main>

      <footer className="w-full bg-card/50 border-t border-border py-10 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-2 text-lg sm:text-xl text-foreground mb-8 mt-8 max-w-md mx-auto">
            <p className="flex items-center justify-center gap-2 font-medium">Conectar para <ArrowRight className="h-5 w-5 text-accent inline-block" /></p>
            <p className="flex items-center justify-center gap-2 font-bold text-accent text-2xl sm:text-3xl"><Sparkles className="h-6 w-6 sm:h-7 sm:w-7 inline-block"/> crescer <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 inline-block"/></p>
            <p className="flex items-center justify-center gap-2 font-medium">negociar <Repeat className="h-5 w-5 text-secondary inline-block" /></p>
            <p className="flex items-center justify-center gap-2 font-bold text-secondary text-2xl sm:text-3xl">para avançar <ChevronsRight className="h-6 w-6 sm:h-7 sm:w-7 inline-block"/></p>
          </div>

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
