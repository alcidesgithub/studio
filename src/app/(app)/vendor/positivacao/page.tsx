
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loadStores, saveStores, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { ThumbsUp, Store as StoreIcon, CheckCircle, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

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
    return allVendors.find(v => v.name === user.storeName); // user.storeName is the Vendor company name for a vendor user
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
      salespersonId: user.id, // ID of the logged-in salesperson (User object)
      salespersonName: user.name, // Name of the logged-in salesperson
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
    return allStores.filter(store => 
      store.participating && 
      (store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       store.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, allStores]);

  if (!currentEvent || !currentVendorCompany) {
    return (
      <div className="animate-fadeIn p-6">
        <PageHeader title="Positivar Lojas" icon={ThumbsUp} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
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
        description={`Interaja com as lojas no ${currentEvent.name}. Você (${user?.name}) pode positivar cada loja uma vez em nome de ${currentVendorCompany.name}.`}
        icon={ThumbsUp}
      />

      <div className="mb-6 relative flex items-center max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar por nome ou código da loja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStores.length === 0 && allStores.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma loja encontrada com o termo pesquisado.
          </CardContent>
        </Card>
      )}
      {allStores.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma loja participante disponível para positivação.
          </CardContent>
        </Card>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store: Store) => {
          const isPositivatedByThisVendorForSession = sessionPositivatedStores.has(store.id);
          // Check if *this vendor company* has already positivada this store
          const isPersistentlyPositivatedByThisVendorCompany = store.positivationsDetails.some(
            detail => detail.vendorId === currentVendorCompany.id 
          );
          const isDisabled = isPositivatedByThisVendorForSession || isPersistentlyPositivatedByThisVendorCompany;

          return (
            <Card key={store.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="h-6 w-6 text-primary" />
                  {store.name} ({store.code})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">
                  Confirme a positivação dessa loja.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => handlePositivar(store.id, store.name)}
                  disabled={isDisabled}
                >
                  {isDisabled ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Positivada por {currentVendorCompany.name}
                    </>
                  ) : (
                    <>
                      {currentVendorCompany.logoUrl ? (
                          <Image
                            src={currentVendorCompany.logoUrl}
                            alt={`Logo ${currentVendorCompany.name}`}
                            width={20}
                            height={20}
                            className="mr-2 object-contain"
                          />
                        ) : (
                          <ThumbsUp className="mr-2 h-4 w-4" /> 
                        )}
                      Positivar Loja
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
    
