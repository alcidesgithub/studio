
"use client"; 

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { loadStores, saveStores, loadEvent, loadVendors } from '@/lib/localStorageUtils';
import { useAuth } from '@/hooks/use-auth';
import type { Store, Event as EventType, Vendor, PositivationDetail } from '@/types';
import { BadgeCheck, Search } from 'lucide-react'; 
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { StorePositivationDisplayCard } from '@/components/cards/StorePositivationDisplayCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type SearchModeFilterType = 'all_stores' | 'matrix_only' | 'branch_only' | 'matrix_with_its_branches';

export default function VendorPositivacaoPage() {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventType | null>(null);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchModeFilter, setSearchModeFilter] = useState<SearchModeFilterType>('all_stores');
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

    if (!targetStore.isCheckedIn) {
      toast({ title: "Check-in Pendente", description: `${storeName} precisa realizar o check-in antes de ser positivada.`, variant: "default" });
      return;
    }

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
      variant: "success",
    });
  }, [currentVendorCompany, user, toast]);

  const cleanCNPJ = useCallback((cnpj: string = '') => {
      return cnpj.replace(/\D/g, '');
  }, []);

  const filteredStores = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const participatingStores = allStores.filter(store => store.participating);
    const cleanedSearchTermForCnpj = searchTerm.replace(/\D/g, '');

    let preliminaryFilteredStores: Store[];

    if (lowerSearchTerm) {
        const exactCodeMatchStore = participatingStores.find(
            s => s.code.toLowerCase() === lowerSearchTerm
        );
         // For branch_only with matrix code, we handle differently, so don't short-circuit here if it's branch_only mode
        if (exactCodeMatchStore && searchModeFilter !== 'branch_only') {
            preliminaryFilteredStores = [exactCodeMatchStore];
        } else {
            preliminaryFilteredStores = participatingStores.filter(store => {
                const checkString = (value?: string) => value?.toLowerCase().includes(lowerSearchTerm);
                const checkCnpj = (cnpjValue?: string) => { 
                    if (!cnpjValue) return false;
                    const cleanedStoreCnpj = cleanCNPJ(cnpjValue);
                    if (cleanedSearchTermForCnpj.length > 0 && cleanedStoreCnpj.includes(cleanedSearchTermForCnpj)) return true;
                    if (!/^\d+$/.test(lowerSearchTerm) && cnpjValue.toLowerCase().includes(lowerSearchTerm)) return true;
                    return false;
                };
                return (
                    checkString(store.name) || checkString(store.code) || checkCnpj(store.cnpj) ||
                    checkString(store.ownerName) || checkString(store.responsibleName) ||
                    checkString(store.city) || checkString(store.neighborhood) || checkString(store.state)
                );
            });
        }
    } else {
        preliminaryFilteredStores = [...participatingStores];
    }

    switch (searchModeFilter) {
        case 'matrix_only':
            return preliminaryFilteredStores.filter(store => store.isMatrix);
        case 'branch_only':
            if (lowerSearchTerm) {
                const potentialMatrixForBranchSearch = participatingStores.find(
                    s => s.code.toLowerCase() === lowerSearchTerm && s.isMatrix
                );
                if (potentialMatrixForBranchSearch) {
                    return participatingStores.filter(
                        s => s.matrixStoreId === potentialMatrixForBranchSearch.id && !s.isMatrix
                    ).sort((a, b) => a.code.localeCompare(b.code));
                } else {
                     // Search term is not a matrix code, so filter preliminary results for branches
                    return preliminaryFilteredStores.filter(s => !s.isMatrix);
                }
            } else {
                 // No search term, show all branches
                return participatingStores.filter(s => !s.isMatrix);
            }
        case 'matrix_with_its_branches':
            if (lowerSearchTerm) {
                const exactMatchingMatrix = participatingStores.find(
                    s => s.code.toLowerCase() === lowerSearchTerm && s.isMatrix
                );
                if (exactMatchingMatrix) {
                    const branches = participatingStores.filter(
                        s => s.matrixStoreId === exactMatchingMatrix.id
                    );
                    return [exactMatchingMatrix, ...branches.sort((a,b) => a.code.localeCompare(b.code))];
                }
            }
            return []; // Requires exact matrix code
        case 'all_stores':
        default:
            return preliminaryFilteredStores;
    }
  }, [searchTerm, allStores, searchModeFilter, cleanCNPJ]);


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
  
  const exactCodeMatchStore = allStores.find(s => s.code.toLowerCase() === searchTerm.toLowerCase().trim());


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={`Positivar Lojas (${currentVendorCompany.name})`}
        description={`Você (${user?.name}) pode positivar cada loja uma vez em nome da ${currentVendorCompany.name}.`}
        icon={BadgeCheck}
        iconClassName="text-secondary"
      />

      <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="store-search-term">Buscar Loja</Label>
          <div className="relative flex items-center mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="store-search-term"
              type="text"
              placeholder="Nome, código, CNPJ, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
            <Label htmlFor="store-type-filter">Filtrar Por Tipo</Label>
            <Select value={searchModeFilter} onValueChange={(value) => setSearchModeFilter(value as SearchModeFilterType)}>
                <SelectTrigger id="store-type-filter" className="mt-1">
                    <SelectValue placeholder="Selecione o tipo de filtro" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all_stores">Todas as Lojas (Padrão)</SelectItem>
                    <SelectItem value="matrix_only">Apenas Matrizes</SelectItem>
                    <SelectItem value="branch_only">Apenas Filiais (ou por cód. matriz)</SelectItem>
                    <SelectItem value="matrix_with_its_branches">Matriz por Código + Filiais</SelectItem>
                </SelectContent>
            </Select>
             {searchModeFilter === 'matrix_with_its_branches' && (
                <p className="text-xs text-muted-foreground mt-1">Para este filtro, busque pelo código exato da matriz.</p>
            )}
        </div>
      </div>
      

      {filteredStores.length === 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            {searchTerm || searchModeFilter !== 'all_stores' 
                ? "Nenhuma loja encontrada com os critérios de busca e filtro selecionados." 
                : "Nenhuma loja participante disponível para positivação." }
             {searchModeFilter === 'matrix_with_its_branches' && searchTerm && !(exactCodeMatchStore && exactCodeMatchStore.isMatrix) &&
                <span className="block mt-1"> Certifique-se de usar o código exato de uma loja matriz para o filtro 'Matriz por Código + Filiais'.</span>
             }
             {searchModeFilter === 'branch_only' && searchTerm && !(filteredStores.length > 0) && allStores.some(s=> s.code.toLowerCase() === searchTerm.toLowerCase() && s.isMatrix) &&
                <span className="block mt-1">Nenhuma filial encontrada para a matriz com código '{searchTerm}'.</span>
             }
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
            allStores={allStores} 
          />
        ))}
      </div>
    </div>
  );
}


