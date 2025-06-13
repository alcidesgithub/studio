
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface EventMapProps {
  embedUrl: string;
  address: string;
}

export function EventMap({ embedUrl, address }: EventMapProps) {
  if (!embedUrl || embedUrl.trim() === "") {
    return (
      <Card className="rounded-lg overflow-hidden shadow-lg h-full">
        <CardContent className="h-full flex flex-col items-center justify-center text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-semibold">Mapa não disponível</p>
          <p className="text-xs text-muted-foreground">
            A URL de incorporação do mapa não foi configurada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border h-full">
      <iframe
        src={embedUrl}
        width="100%"
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map for ${address}`}
      ></iframe>
    </div>
  );
}
