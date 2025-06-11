
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
        title: "Already Promoted",
        description: `You have already promoted ${storeName} for this event.`,
        variant: "default",
      });
      return;
    }

    setPositivatedStores(prev => new Set(prev).add(storeId));
    toast({
      title: "Store Promoted!",
      description: `Successfully promoted ${storeName}.`,
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
        title="Promote Stores"
        description={`Engage with stores for ${MOCK_EVENT.name}. You can promote each store once.`}
        icon={ThumbsUp}
      />

      <div className="mb-6 relative flex items-center max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Search for a store..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10" // Add padding to the left for the icon
        />
      </div>

      {filteredStores.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No stores found matching your search or no participating stores available.
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
              {/* Displaying number of positivations from store's perspective, not just this vendor's */}
              <CardDescription>Current Positivações: {store.positivationsDetails.length}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">
                Engage with this store to acknowledge their participation and efforts.
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
                    <CheckCircle className="mr-2 h-4 w-4" /> Promoted
                  </>
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Promote Store
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
