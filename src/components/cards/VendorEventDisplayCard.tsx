
"use client";

import React from 'react';
import Image from 'next/image';
import type { Vendor } from '@/types';

interface VendorEventDisplayCardProps {
  vendor: Vendor;
}

export const VendorEventDisplayCard = React.memo(function VendorEventDisplayCard({ vendor }: VendorEventDisplayCardProps) {
  return (
    <div className="p-2 sm:p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow w-full h-28 sm:h-32 flex flex-col items-center justify-center text-center">
      <div className="relative w-full h-16 sm:h-20 mb-1">
        <Image
          src={vendor.logoUrl}
          alt={`Logo ${vendor.name}`}
          layout="fill"
          objectFit="contain"
          className="rounded"
          data-ai-hint="vendor logo"
        />
      </div>
      <p className="text-xs font-medium text-muted-foreground mt-1 truncate w-full">{vendor.name}</p>
    </div>
  );
});
VendorEventDisplayCard.displayName = 'VendorEventDisplayCard';
