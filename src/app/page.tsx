
import { EventMap } from '@/components/event/EventMap';
// import { MOCK_EVENT, MOCK_VENDORS } from '@/lib/constants'; // No longer using mocks directly
import { loadEvent, loadVendors } from '@/lib/localStorageUtils.ssr'; // Using SSR version for server component
import { CalendarDays, Clock, MapPin as MapPinIcon, Users } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

// This function will run on the server
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
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">
            {event.name}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90">
            O ponto de encontro da indústria farmacêutica para negócios e inovação.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section id="event-details" className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
          <h2 className="text-3xl font-semibold mb-6 text-center text-primary font-headline">Detalhes do Evento</h2>
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

        <section id="map" className="mb-12">
           <h2 className="text-3xl font-semibold mb-6 text-center text-primary font-headline">Como Chegar</h2>
          <EventMap embedUrl={event.mapEmbedUrl} address={event.address} />
        </section>

        <section id="vendors" className="mb-12 p-8 bg-card text-card-foreground rounded-xl shadow-2xl">
          <h2 className="text-3xl font-semibold mb-8 text-center text-primary font-headline flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-primary"/>
            Fornecedores Participantes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 place-items-center">
            {vendors.map(vendor => (
              <div key={vendor.id} className="p-4 bg-background rounded-lg shadow-md hover:shadow-lg transition-shadow w-full h-full flex items-center justify-center">
                <Image
                  src={vendor.logoUrl}
                  alt={vendor.name}
                  width={150}
                  height={80}
                  className="object-contain"
                  data-ai-hint={vendor.dataAiHint || "company logo"}
                />
              </div>
            ))}
            {vendors.length === 0 && (
                 <p className="col-span-full text-center text-muted-foreground py-4">Nenhum fornecedor participante cadastrado.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full bg-primary text-primary-foreground py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Hiperfarma Business Meeting Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Create a separate file for SSR-safe local storage utilities or adapt usage
// For simplicity in this context, I'll create `localStorageUtils.ssr.ts`
// that returns mock data if `window` is not defined.
// In a real app, you'd fetch this from a DB or API for server components.
