
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { loadStores, saveStores, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { BadgeCheck, Search, Store as StoreIcon } from 'lucide-react'; 
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { StorePositivationDisplayCard } from '@/components/cards/StorePositivationDisplayCard';

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

  const handlePositivar = useCallback((storeId: string, storeName: string) => {
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
  }, [currentVendorCompany, user, toast, setSessionPositivatedStores, setAllStores]);

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
        
        // Check formatted CNPJ as well (e.g., if user types "XX.XXX.XXX/YYYY-ZZ")
        // Note: formatDisplayCNPJ is not available here, so direct check or import it.
        // For simplicity, we'll rely on the cleaned CNPJ for now or assume user types parts of it.
        if (cnpjValue.toLowerCase().includes(lowerSearchTerm)) { // This may catch parts of formatted CNPJ
            return true;
        }
        return false;
      };

      return (
        checkString(store.name) ||
        checkString(store.code) ||
        checkCnpj(store.cnpj) ||
        checkString(store.ownerName) ||
        checkString(store.responsibleName) || 
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
        description={`Você (${user?.name}) pode positivar cada loja uma vez em nome da ${currentVendorCompany.name}.`}
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
        {filteredStores.map((store: Store) => (
          <StorePositivationDisplayCard
            key={store.id}
            store={store}
            currentVendorCompany={currentVendorCompany}
            sessionPositivatedStores={sessionPositivatedStores}
            onPositivar={handlePositivar}
          />
        ))}
      </div>
    </div>
  );
}
