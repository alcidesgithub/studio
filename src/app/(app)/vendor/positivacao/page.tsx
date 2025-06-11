
"use client"; // For client-side interactions and state

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MOCK_STORES, MOCK_EVENT } from '@/lib/constants';
import type { Store } from '@/types';
import { ThumbsUp, Store as StoreIcon, CheckCircle, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function VendorPositivacaoPage() {
  const [positivatedStores, setPositivatedStores] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handlePositivar = (storeId: string, storeName: string) => {
    // In a real app, this would be an API call
    // and would check if already positivated for this event by this vendor.
    if (positivatedStores.has(storeId)) {
      toast({
        title: "Já Positivado",
        description: `Você já positivou ${storeName} para este evento.`,
        variant: "default",
      });
      return;
    }

    setPositivatedStores(prev => new Set(prev).add(storeId));
    toast({
      title: "Loja Positivada!",
      description: `Loja ${storeName} positivada com sucesso.`,
    });
  };

  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => 
      store.participating && store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, MOCK_STORES]); // Added MOCK_STORES to dependency array

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Positivar Lojas"
        description={`Interaja com as lojas no ${MOCK_EVENT.name}. Você pode positivar cada loja uma vez.`}
        icon={ThumbsUp}
      />

      <div className="mb-6 relative flex items-center max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Buscar por uma loja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10" // Add padding to the left for the icon
        />
      </div>

      {filteredStores.length === 0 && MOCK_STORES.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma loja encontrada com o termo pesquisado.
          </CardContent>
        </Card>
      )}
      {MOCK_STORES.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma loja participante disponível para positivação.
          </CardContent>
        </Card>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store: Store) => (
          <Card key={store.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StoreIcon className="h-6 w-6 text-primary" />
                {store.name}
              </CardTitle>
              <CardDescription>Positivações Atuais: {store.positivationsDetails.length}</CardDescription>
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
                disabled={positivatedStores.has(store.id)}
              >
                {positivatedStores.has(store.id) ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Positivada
                  </>
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Positivar Loja
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
