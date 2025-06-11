
// Intentionally changed filename to vendor BMM for testing. The path should be vendor
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { MOCK_STORES, MOCK_EVENT } from '@/lib/constants'; // No longer using mocks directly
import { loadStores, saveStores, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { ThumbsUp, Store as StoreIcon, CheckCircle, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function VendorPositivacaoPage() {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth(); // To identify the current vendor

  // This state tracks which stores this vendor has positivated *in this session/instance*
  // For true persistence of "who positivated whom", this would need to be stored
  // within the Store's positivationsDetails, including vendorId.
  const [sessionPositivatedStores, setSessionPositivatedStores] = useState<Set<string>>(new Set());


  useEffect(() => {
    setAllStores(loadStores());
    setCurrentEvent(loadEvent());
    setAllVendors(loadVendors());
  }, []);

  const currentVendor = useMemo(() => {
    if (!user || user.role !== 'vendor' || !user.storeName) return null; // storeName for vendor holds their company name
    return allVendors.find(v => v.name === user.storeName);
  }, [user, allVendors]);

  const handlePositivar = (storeId: string, storeName: string) => {
    if (!currentVendor) {
      toast({ title: "Erro", description: "Dados do fornecedor não encontrados.", variant: "destructive" });
      return;
    }

    const storesFromStorage = loadStores(); // Load fresh list of stores
    const targetStoreIndex = storesFromStorage.findIndex(s => s.id === storeId);

    if (targetStoreIndex === -1) {
      toast({ title: "Erro", description: "Loja não encontrada.", variant: "destructive" });
      return;
    }

    const targetStore = storesFromStorage[targetStoreIndex];

    // Check if this vendor has already positivated this store
    const alreadyPositivatedByThisVendor = targetStore.positivationsDetails.some(
      detail => detail.vendorId === currentVendor.id
    );

    if (alreadyPositivatedByThisVendor) {
      toast({
        title: "Já Positivado",
        description: `Você (Fornecedor: ${currentVendor.name}) já positivou ${storeName} para este evento.`,
        variant: "default",
      });
      return;
    }

    const newPositivation: PositivationDetail = {
      vendorId: currentVendor.id,
      vendorName: currentVendor.name,
      vendorLogoUrl: currentVendor.logoUrl,
      vendorDataAiHint: currentVendor.dataAiHint,
      date: new Date().toISOString(),
    };

    const updatedStore = {
      ...targetStore,
      positivationsDetails: [...targetStore.positivationsDetails, newPositivation],
    };

    storesFromStorage[targetStoreIndex] = updatedStore;
    saveStores(storesFromStorage); // Save the entire updated list
    setAllStores(storesFromStorage); // Update local component state to re-render UI

    setSessionPositivatedStores(prev => new Set(prev).add(storeId)); // For immediate UI feedback on button

    toast({
      title: "Loja Positivada!",
      description: `Loja ${storeName} positivada com sucesso por ${currentVendor.name}.`,
    });
  };

  const filteredStores = useMemo(() => {
    return allStores.filter(store => 
      store.participating && store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allStores]);

  if (!currentEvent || !currentVendor) {
    return (
      <div className="animate-fadeIn p-6">
        <PageHeader title="Positivar Lojas" icon={ThumbsUp} />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            { !currentEvent ? "Carregando dados do evento..." : "Dados do fornecedor não encontrados. Faça login como fornecedor."}
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`Positivar Lojas (${currentVendor.name})`}
        description={`Interaja com as lojas no ${currentEvent.name}. Você pode positivar cada loja uma vez.`}
        icon={ThumbsUp}
      />

      <div className="mb-6 relative flex items-center max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar por uma loja..."
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
          // More accurate check against persisted data:
          const isPersistentlyPositivatedByThisVendor = store.positivationsDetails.some(
            detail => detail.vendorId === currentVendor.id
          );
          const isDisabled = isPositivatedByThisVendorForSession || isPersistentlyPositivatedByThisVendor;

          return (
            <Card key={store.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="h-6 w-6 text-primary" />
                  {store.name} ({store.code})
                </CardTitle>
                <CardDescription>Selos Atuais: {store.positivationsDetails.length}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">
                  Interaja com esta loja para reconhecer sua participação e esforços.
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
                      <CheckCircle className="mr-2 h-4 w-4" /> Positivada por você
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="mr-2 h-4 w-4" /> Positivar Loja
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
