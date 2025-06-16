
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, CheckCircle, User, MapPin, Building as BuildingIcon, BadgeCheck } from 'lucide-react';
import type { Store, Vendor } from '@/types';
import { formatDisplayCNPJ } from '@/lib/utils';

interface StorePositivationDisplayCardProps {
  store: Store;
  currentVendorCompany: Vendor;
  sessionPositivatedStores: Set<string>;
  onPositivar: (storeId: string, storeName: string) => void;
}

export const StorePositivationDisplayCard = React.memo(function StorePositivationDisplayCard({
  store,
  currentVendorCompany,
  sessionPositivatedStores,
  onPositivar,
}: StorePositivationDisplayCardProps) {
  const isPositivatedByThisVendorForSession = sessionPositivatedStores.has(store.id);
  const isPersistentlyPositivatedByThisVendorCompany = store.positivationsDetails.some(
    detail => detail.vendorId === currentVendorCompany.id
  );
  const isDisabled = isPositivatedByThisVendorForSession || isPersistentlyPositivatedByThisVendorCompany;

  return (
    <Card key={store.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <StoreIcon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary flex-shrink-0" />
          <span className="truncate">{store.name} ({store.code})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-xs sm:text-sm">
        <p className="text-secondary mb-2 text-sm font-semibold">
          Confirme a positivação dessa loja.
        </p>
        {store.cnpj && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BuildingIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">CNPJ:</span>
            <span>{formatDisplayCNPJ(store.cnpj)}</span>
          </div>
        )}
        {store.ownerName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Proprietário:</span>
            <span className="truncate">{store.ownerName}</span>
          </div>
        )}
        {store.responsibleName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Responsável:</span>
            <span className="truncate">{store.responsibleName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">Local:</span>
          <span className="truncate">
            {store.city || 'N/A'} - {store.neighborhood || 'N/A'} ({store.state || 'N/A'})
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full h-[70px] sm:h-[80px] text-sm sm:text-lg"
          onClick={() => onPositivar(store.id, store.name)}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <>
              <CheckCircle className="mr-2 sm:mr-3 flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="truncate min-w-0">Positivada por {currentVendorCompany.name}</span>
            </>
          ) : (
            <>
              {currentVendorCompany.logoUrl ? (
                <div className="relative w-[70px] h-[40px] sm:w-[90px] sm:h-[60px] flex-shrink-0 mr-2 sm:mr-3">
                  <Image
                    src={currentVendorCompany.logoUrl}
                    alt={`Logo ${currentVendorCompany.name}`}
                    layout="fill"
                    objectFit="contain"
                    data-ai-hint="vendor logo"
                  />
                </div>
              ) : (
                <BadgeCheck className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
              )}
              <span className="truncate min-w-0">Positivar Loja</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
});
StorePositivationDisplayCard.displayName = 'StorePositivationDisplayCard';
