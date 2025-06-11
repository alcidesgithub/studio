"use client";

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_EVENT } from '@/lib/constants';
import { EventMap } from '@/components/event/EventMap';
import { CalendarDays, Clock, MapPin as MapPinIcon, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns'; // Added parseISO
// import type { Metadata } from 'next'; // Metadata cannot be used in Client Components

// export const metadata: Metadata = {
//   title: 'Event Information - Hiperfarma Business Meeting Manager',
// };

export default function EventInfoPage() {
  // Ensure date is parsed correctly. MOCK_EVENT.date is an ISO string.
  const eventDate = MOCK_EVENT.date ? parseISO(MOCK_EVENT.date) : new Date();


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Event Information"
        description={`Details for ${MOCK_EVENT.name}`}
        icon={Building}
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{MOCK_EVENT.name}</CardTitle>
              <CardDescription>All you need to know about the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Date</h3>
                  <p className="text-muted-foreground">{format(eventDate, 'MMMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Time</h3>
                  <p className="text-muted-foreground">{MOCK_EVENT.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">{MOCK_EVENT.location}</p>
                  <p className="text-xs text-muted-foreground/80">{MOCK_EVENT.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <EventMap embedUrl={MOCK_EVENT.mapEmbedUrl} address={MOCK_EVENT.address} />
        </div>
      </div>
    </div>
  );
}
