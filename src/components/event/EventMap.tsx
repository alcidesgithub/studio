"use client";

interface EventMapProps {
  embedUrl: string;
  address: string;
}

export function EventMap({ embedUrl, address }: EventMapProps) {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg border">
      <iframe
        src={embedUrl}
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map for ${address}`}
      ></iframe>
    </div>
  );
}
