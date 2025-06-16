
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, CheckCircle, User, MapPin, Building as BuildingIcon, BadgeCheck, AlertTriangle } from 'lucide-react';
import type { Store, Vendor } from '@/types';
import { formatDisplayCNPJ } from '@/lib/utils';
import { cn } from "@/lib/utils";

interface StorePositivationDisplayCardProps {
  store: Store;
  currentVendorCompany: Vendor;
  sessionPositivatedStores: Set<string>;
  onPositivar: (storeId: string, storeName: string) => void;
  allStores: Store[];
}

export const StorePositivationDisplayCard = React.memo(function StorePositivationDisplayCard({
  store,
  currentVendorCompany,
  sessionPositivatedStores,
  onPositivar,
  allStores,
}: StorePositivationDisplayCardProps) {
  const isPositivatedByThisVendorForSession = sessionPositivatedStores.has(store.id);
  const isPersistentlyPositivatedByThisVendorCompany = store.positivationsDetails.some(
    detail => detail.vendorId === currentVendorCompany.id
  );
  const isActionDisabled = isPositivatedByThisVendorForSession || isPersistentlyPositivatedByThisVendorCompany || !store.isCheckedIn || !store.participating;
  const buttonAlreadyPositivated = isPositivatedByThisVendorForSession || isPersistentlyPositivatedByThisVendorCompany;


  const matrixStore = !store.isMatrix && store.matrixStoreId ? allStores.find(s => s.id === store.matrixStoreId) : null;
  const matrixStoreCode = matrixStore ? matrixStore.code : null;

  return (
    <Card key={store.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-start gap-2 text-base sm:text-lg">
          <StoreIcon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <span className="block font-semibold truncate" title={store.name}>{store.name}</span>
            <span className="block text-sm text-secondary font-bold truncate" title={`Código: ${store.code}`}>Código: {store.code}</span>
            {!store.isMatrix && matrixStoreCode && (
              <span className="block text-sm text-[#7b7a6d] truncate" title={`Matriz: ${matrixStoreCode}`}>
                Filial de: {matrixStoreCode}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-1.5 text-xs sm:text-sm">
        <p className={cn(
            "mb-2 text-sm font-semibold",
            !store.isCheckedIn ? "text-orange-600" : "text-secondary"
        )}>
          {!store.participating
            ? "Loja não participante do evento."
            : !store.isCheckedIn
            ? "Loja aguardando check-in."
            : "Confirme a positivação dessa loja."}
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
          className={cn(
            "w-full h-16 text-base font-semibold",
            !buttonAlreadyPositivated && store.isCheckedIn && store.participating ? "pl-4" : ""
          )}
          onClick={() => onPositivar(store.id, store.name)}
          disabled={isActionDisabled}
          size="lg"
        >
          {buttonAlreadyPositivated ? (
            <>
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
              <div className="truncate">
                Positivada por {currentVendorCompany.name}
              </div>
            </>
          ) : !store.participating ? (
             <>
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <div className="truncate">Loja Não Participante</div>
            </>
          ) : !store.isCheckedIn ? (
            <>
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <div className="truncate">Aguardando Check-in</div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              {currentVendorCompany.logoUrl ? (
                <div className="relative w-24 h-12 flex-shrink-0">
                  <Image
                    src={currentVendorCompany.logoUrl}
                    alt={`Logo ${currentVendorCompany.name}`}
                    layout="fill"
                    objectFit="contain"
                    data-ai-hint="vendor logo"
                  />
                </div>
              ) : (
                <BadgeCheck className="h-6 w-6 flex-shrink-0" />
              )}
              <div>Positivar Loja</div>
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
});
StorePositivationDisplayCard.displayName = 'StorePositivationDisplayCard';
