
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loadStores, saveStores, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { BadgeCheck, Store as StoreIcon, CheckCircle, Search, User, MapPin, Building as BuildingIcon } from 'lucide-react'; 
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { formatDisplayCNPJ } from '@/lib/utils';

export default function VendorPositivacaoPage() {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth(); 

  const [sessionPositivatedStores, setSessionPositivatedStores] = useState<Set<string>>(new Set());


  useEffect(() => {
    setAllStores(loadStores());
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors());
  }, []);

  const currentVendorCompany = useMemo(() => {
    if (!user || user.role !== 'vendor' || !user.storeName) return null; 
    return allVendors.find(v => v.name === user.storeName); 
  }, [user, allVendors]);

  const handlePositivar = (storeId: string, storeName: string) => {
    if (!currentVendorCompany || !user) {
      toast({ title: "Erro", description: "Dados do fornecedor ou do usuário não encontrados.", variant: "destructive" });
      return;
    }

    const storesFromStorage = loadStores(); 
    const targetStoreIndex = storesFromStorage.findIndex(s => s.id === storeId);

    if (targetStoreIndex === -1) {
      toast({ title: "Erro", description: "Loja não encontrada.", variant: "destructive" });
      return;
    }

    const targetStore = storesFromStorage[targetStoreIndex];

    const alreadyPositivatedByThisVendor = targetStore.positivationsDetails.some(
      detail => detail.vendorId === currentVendorCompany.id
    );

    if (alreadyPositivatedByThisVendor) {
      toast({
        title: "Já Positivado",
        description: `Sua empresa (${currentVendorCompany.name}) já positivou ${storeName} para este evento.`,
        variant: "default",
      });
      return;
    }

    const newPositivation: PositivationDetail = {
      vendorId: currentVendorCompany.id,
      vendorName: currentVendorCompany.name,
      vendorLogoUrl: currentVendorCompany.logoUrl,
      date: new Date().toISOString(),
      salespersonId: user.id, 
      salespersonName: user.name, 
    };

    const updatedStore = {
      ...targetStore,
      positivationsDetails: [...targetStore.positivationsDetails, newPositivation],
    };

    storesFromStorage[targetStoreIndex] = updatedStore;
    saveStores(storesFromStorage); 
    setAllStores(storesFromStorage); 

    setSessionPositivatedStores(prev => new Set(prev).add(storeId)); 

    toast({
      title: "Loja Positivada!",
      description: `Loja ${storeName} positivada com sucesso por ${user.name} (${currentVendorCompany.name}).`,
    });
  };

  const filteredStores = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const cleanedSearchTermForCnpj = searchTerm.replace(/\D/g, '');

    return allStores.filter(store => {
      if (!store.participating) return false;

      const checkString = (value?: string) => value?.toLowerCase().includes(lowerSearchTerm);
      
      const checkCnpj = (cnpjValue?: string) => { 
        if (!cnpjValue) return false;
        
        if (cleanedSearchTermForCnpj.length > 0 && cleanCNPJ(cnpjValue).includes(cleanedSearchTermForCnpj)) {
          return true;
        }
        
        if (formatDisplayCNPJ(cnpjValue).toLowerCase().includes(lowerSearchTerm)) {
            return true;
        }
        return false;
      };

      return (
        checkString(store.name) ||
        checkString(store.code) ||
        checkCnpj(store.cnpj) ||
        checkString(store.ownerName) ||
        checkString(store.responsibleName) || // Added responsibleName to search
        checkString(store.city) ||
        checkString(store.neighborhood) ||
        checkString(store.state)
      );
    });
  }, [searchTerm, allStores]);

  const cleanCNPJ = (cnpj: string = '') => {
      return cnpj.replace(/\D/g, '');
  };


  if (!currentEvent || !currentVendorCompany) {
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <PageHeader title="Positivar Lojas" icon={BadgeCheck} iconClassName="text-secondary" />
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            { !currentEvent ? "Carregando dados do evento..." : "Dados da empresa fornecedora não encontrados. Faça login como vendedor."}
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`Positivar Lojas (${currentVendorCompany.name})`}
        description={`Você (${user?.name}) pode positivar cada loja uma vez em nome de ${currentVendorCompany.name}.`}
        icon={BadgeCheck}
        iconClassName="text-secondary"
      />

      <div className="mb-4 sm:mb-6 relative flex items-center max-w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar por nome, código, CNPJ, proprietário, local..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStores.length === 0 && allStores.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Nenhuma loja encontrada com o termo pesquisado.
          </CardContent>
        </Card>
      )}
      {allStores.length === 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            Nenhuma loja participante disponível para positivação.
          </CardContent>
        </Card>
      )}


      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStores.map((store: Store) => {
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
                  onClick={() => handlePositivar(store.id, store.name)}
                  disabled={isDisabled}
                >
                  {isDisabled ? (
                    <>
                      <CheckCircle className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6" /> 
                      <span className="truncate min-w-0 ml-2">Positivada por {currentVendorCompany.name}</span>
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
        })}
      </div>
    </div>
  );
}
    

    
