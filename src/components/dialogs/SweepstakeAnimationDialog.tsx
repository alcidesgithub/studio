
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PlayCircle, CheckCircle, Gift, Store as StoreIcon } from 'lucide-react';
import type { Store } from '@/types';
import type { AwardTierWithStats } from '@/app/(app)/admin/sweepstakes-by-tier/page'; // Adjust path as necessary

interface SweepstakeAnimationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tier: AwardTierWithStats;
  onConfirmWinner: (winner: Store) => void;
}

export const SweepstakeAnimationDialog: React.FC<SweepstakeAnimationDialogProps> = ({
  isOpen,
  onOpenChange,
  tier,
  onConfirmWinner,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'animating' | 'result'>('idle');
  const [displayedStoreName, setDisplayedStoreName] = useState<string>('');
  const [winningStore, setWinningStore] = useState<Store | null>(null);
  const [animationIndex, setAnimationIndex] = useState(0);

  const eligibleStoresForAnimation = useMemo(() => {
    // Shuffle eligible stores to make animation appear more random each time
    return [...tier.eligibleStores].sort(() => 0.5 - Math.random());
  }, [tier.eligibleStores]);


  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setAnimationPhase('idle');
      setDisplayedStoreName('');
      setWinningStore(null);
      setAnimationIndex(0);
    } else {
      // Reset to idle when opened, in case it was previously in result phase
      setAnimationPhase('idle');
      setWinningStore(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let animationInterval: NodeJS.Timeout | undefined;
    let stopAnimationTimeout: NodeJS.Timeout | undefined;

    if (animationPhase === 'animating' && eligibleStoresForAnimation.length > 0) {
      animationInterval = setInterval(() => {
        setAnimationIndex(prevIndex => (prevIndex + 1) % eligibleStoresForAnimation.length);
      }, 100); // Update displayed name every 100ms

      stopAnimationTimeout = setTimeout(() => {
        clearInterval(animationInterval);
        const randomIndex = Math.floor(Math.random() * tier.eligibleStores.length); // Use original list for final pick
        const actualWinner = tier.eligibleStores[randomIndex];
        setWinningStore(actualWinner);
        setAnimationPhase('result');
      }, 10000); // 10 seconds
    } else if (animationPhase === 'animating' && eligibleStoresForAnimation.length === 0) {
        // Should not happen if button is disabled, but as a fallback
        setAnimationPhase('idle'); 
    }


    return () => {
      if (animationInterval) clearInterval(animationInterval);
      if (stopAnimationTimeout) clearTimeout(stopAnimationTimeout);
    };
  }, [animationPhase, eligibleStoresForAnimation, tier.eligibleStores]);

  useEffect(() => {
    if (animationPhase === 'animating' && eligibleStoresForAnimation.length > 0) {
      setDisplayedStoreName(`${eligibleStoresForAnimation[animationIndex].code} - ${eligibleStoresForAnimation[animationIndex].name}`);
    }
  }, [animationIndex, animationPhase, eligibleStoresForAnimation]);

  const handleStartAnimation = () => {
    if (tier.eligibleStores.length > 0) {
      setAnimationPhase('animating');
    }
  };

  const handleConfirm = () => {
    if (winningStore) {
      onConfirmWinner(winningStore);
    }
    onOpenChange(false); // Close dialog
  };
  
  const canStartSweepstake = tier.eligibleStores.length > 0 && tier.remainingQuantity > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Sorteio da Faixa: <br /> {tier.name}
          </DialogTitle>
          <DialogDescription className="text-center">
            Prêmio: <span className="font-semibold text-primary">{tier.rewardName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <StoreIcon className="h-5 w-5 text-secondary" />
                <span>{tier.eligibleStores.length} {tier.eligibleStores.length === 1 ? "loja elegível" : "lojas elegíveis"} para este prêmio.</span>
            </div>

          {animationPhase === 'idle' && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Clique abaixo para iniciar o sorteio.</p>
                 <ScrollArea className="h-32 w-full rounded-md border p-2 text-xs">
                    <p className="font-semibold mb-1">Lojas Elegíveis:</p>
                    {tier.eligibleStores.map(store => (
                        <div key={store.id}>{store.code} - {store.name} ({store.state})</div>
                    ))}
                </ScrollArea>
            </div>
          )}

          {animationPhase === 'animating' && (
            <div className="text-center p-8 bg-secondary/10 rounded-lg min-h-[150px] flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-xl font-semibold text-primary">Sorteando...</p>
              <p className="text-lg text-muted-foreground h-6 truncate w-full max-w-xs" title={displayedStoreName}>
                {displayedStoreName}
              </p>
            </div>
          )}

          {animationPhase === 'result' && winningStore && (
            <div className="text-center p-6 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-500">
              <Gift className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="text-sm text-green-700 dark:text-green-300">Parabéns para a loja vencedora!</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-200 mt-1 truncate" title={`${winningStore.code} - ${winningStore.name}`}>
                {winningStore.code} - {winningStore.name}
              </p>
              <p className="text-xs text-muted-foreground">CNPJ: {winningStore.cnpj} | Estado: {winningStore.state}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {animationPhase === 'idle' && (
            <Button onClick={handleStartAnimation} className="w-full" size="lg" disabled={!canStartSweepstake}>
              <PlayCircle className="mr-2 h-5 w-5" /> Iniciar Sorteio
            </Button>
          )}
          {animationPhase === 'animating' && (
            <Button className="w-full" size="lg" disabled>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sorteando... Aguarde
            </Button>
          )}
          {animationPhase === 'result' && (
            <Button onClick={handleConfirm} className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" /> Confirmar Ganhador e Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

