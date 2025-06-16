
"use client";

import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck } from 'lucide-react';
import type { Vendor, PositivationDetail } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendorPositivationDisplayCardProps {
  vendor: Vendor;
  positivation?: PositivationDetail; // Make optional if vendor might not be positivated
}

export const VendorPositivationDisplayCard = React.memo(function VendorPositivationDisplayCard({
  vendor,
  positivation,
}: VendorPositivationDisplayCardProps) {
  const isPositivated = !!positivation;

  return (
    <div
      key={vendor.id}
      className={`
        flex flex-col items-center p-3 sm:p-4 rounded-lg 
         text-center min-h-[160px] sm:min-h-[180px] justify-between
      `}
    >
      <div className="flex flex-col items-center">
        <Avatar className={`w-12 h-12 mb-2 ${!isPositivated ? 'opacity-60' : ''}`}>
          <AvatarImage src={vendor.logoUrl} alt={vendor.name} className="object-contain" />
          <AvatarFallback>{vendor.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <p className={`text-xs sm:text-sm font-semibold text-center w-full ${isPositivated ? 'text-white' : 'text-white/60'}`}>
          {vendor.name}
        </p>
      </div>

      <div className="text-xs mt-2 w-full">
        {isPositivated && positivation?.salespersonName && positivation.date && isValid(parseISO(positivation.date)) ? (
          <>
            <p className="text-white flex items-center justify-center">
              <BadgeCheck className="inline-block h-3.5 w-3.5 mr-1 text-secondary" />
              <span className="font-semibold">Positivado por: {positivation.salespersonName}</span>
            </p>
            <p className="text-white/80 mt-0.5">
              Em: {format(parseISO(positivation.date), "dd/MM HH:mm", { locale: ptBR })}
            </p>
          </>
        ) : isPositivated && positivation && positivation.date && isValid(parseISO(positivation.date)) ? (
           <>
            <p className="text-white flex items-center justify-center">
              <BadgeCheck className="inline-block h-3.5 w-3.5 mr-1 text-secondary" />
              <span className="font-semibold">Positivado!</span>
            </p>
            <p className="text-white/80 mt-0.5">
              Em: {format(parseISO(positivation.date), "dd/MM HH:mm", { locale: ptBR })}
            </p>
           </>
        ) : (
          <p className="text-white/50">Ainda não positivado</p>
        )}
      </div>
    </div>
  );
});
VendorPositivationDisplayCard.displayName = 'VendorPositivationDisplayCard';

