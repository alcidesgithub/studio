
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadEvent, loadVendors } from '@/lib/localStorageUtils';
import type { Event, Vendor } from '@/types';
import { EventMap } from '@/components/event/EventMap';
import { CalendarDays, Clock, MapPin as MapPinIcon, Briefcase, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { VendorEventDisplayCard } from '@/components/cards/VendorEventDisplayCard';
import { useAuth } from '@/hooks/use-auth';


export default function EventInfoPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dataIsLoading, setDataIsLoading] = useState(true);

  useEffect(() => {
    setDataIsLoading(true);
    setCurrentEvent(loadEvent());
    setVendors(loadVendors().sort((a,b) => a.name.localeCompare(b.name)));
    setDataIsLoading(false);
  }, []);

  if (authIsLoading || dataIsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Informações do evento" icon={MapPinIcon} iconClassName="text-secondary" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Detalhes do evento não configurados.
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
        icon={MapPinIcon}
        iconClassName="text-secondary"
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
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Data</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Horário</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{currentEvent.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Localização</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{currentEvent.location}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground/80">{currentEvent.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

           {(currentEvent.vendorGuideUrl || currentEvent.associateGuideUrl) && user && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary"/> Guia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === 'vendor' && currentEvent.vendorGuideUrl && (
                  <Button asChild className="w-full">
                    <a href={currentEvent.vendorGuideUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir Guia do Fornecedor
                    </a>
                  </Button>
                )}
                {user.role === 'store' && currentEvent.associateGuideUrl && (
                  <Button asChild className="w-full">
                    <a href={currentEvent.associateGuideUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir Guia do Associado
                    </a>
                  </Button>
                )}
                {(user.role === 'admin' || user.role === 'manager') && (
                  <>
                    {currentEvent.vendorGuideUrl && (
                      <Button asChild variant="outline" className="w-full">
                        <a href={currentEvent.vendorGuideUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Guia do Fornecedor (Admin)
                        </a>
                      </Button>
                    )}
                    {currentEvent.associateGuideUrl && (
                      <Button asChild variant="outline" className="w-full">
                        <a href={currentEvent.associateGuideUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Guia do Associado (Admin)
                        </a>
                      </Button>
                    )}
                  </>
                )}
                 {user.role !== 'vendor' && user.role !== 'store' && user.role !== 'admin' && user.role !== 'manager' && (
                  <p className="text-xs text-muted-foreground">Nenhum guia disponível para seu perfil.</p>
                )}
                {(user.role === 'vendor' && !currentEvent.vendorGuideUrl) && <p className="text-xs text-muted-foreground text-center">Guia do Fornecedor não disponível.</p>}
                {(user.role === 'store' && !currentEvent.associateGuideUrl) && <p className="text-xs text-muted-foreground text-center">Guia do Associado não disponível.</p>}

              </CardContent>
            </Card>
          )}

        </div>
        <div className="lg:col-span-2 h-full">
          <EventMap embedUrl={currentEvent.mapEmbedUrl} address={currentEvent.address} />
        </div>
      </div>

      <Card className="shadow-lg mt-8 sm:mt-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-headline">
            <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" /> Fornecedores Participantes
          </CardTitle>
          <CardDescription>Conheça os fornecedores que estarão presentes no evento.</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 place-items-center">
              {vendors.map((vendor) => (
                <VendorEventDisplayCard key={vendor.id} vendor={vendor} />
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
