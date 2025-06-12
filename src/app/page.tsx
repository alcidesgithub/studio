
import { EventMap } from '@/components/event/EventMap';
import { loadEvent, loadVendors } from '@/lib/localStorageUtils.ssr'; 
import { CalendarDays, Clock, MapPin as MapPinIcon, Users } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

async function getPageData() {
  const event = loadEvent();
  const vendors = loadVendors();
  return { event, vendors };
}

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await getPageData();
  return {
    title: `${event.name} - Página Inicial`,
    description: `Participe do ${event.name}. Detalhes do evento, localização e fornecedores participantes.`,
  };
}

export default async function LandingPage() {
  const { event, vendors } = await getPageData();
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
          {/* Título e descrição removidos conforme solicitado */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section id="event-details-section" aria-labelledby="event-details-heading" className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
          <h2 id="event-details-heading" className="text-3xl font-semibold mb-6 text-center text-primary font-headline">Detalhes do Evento</h2>
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
            <Users className="h-8 w-8 text-accent"/> {/* Alterado para text-accent */}
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
        <p className="text-sm">&copy; {new Date().getFullYear()} Hiperfarma Business Meeting Manager. Todos os direitos reservados.</p> {/* Adicionado text-sm */}
      </footer>
    </div>
  );
}
