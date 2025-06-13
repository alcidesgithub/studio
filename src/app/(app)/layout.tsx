
"use client";

import { useEffect, useState } from 'react'; // Adicionado useState
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SheetTitle } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadEvent } from '@/lib/localStorageUtils'; // Importado loadEvent
import type { Event } from '@/types'; // Importado tipo Event

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null); // Estado para o evento

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Carrega detalhes do evento
    const eventDetails = loadEvent();
    setCurrentEvent(eventDetails);
  }, []);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Este caso idealmente é tratado pelo redirect do useEffect,
    // mas como fallback:
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4">Redirecionando para o login...</p>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Verifica acesso baseado em role para rotas admin
  if (pathname.startsWith('/admin') && !['admin', 'manager'].includes(user.role)) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="mb-4">Você não tem permissão para visualizar esta página.</p>
          <Button onClick={() => router.push(user.role === 'store' ? '/store/positivacao' : (user.role === 'vendor' ? '/vendor/positivacao' : '/dashboard'))}>Ir para Página Inicial</Button>
        </div>
      );
  }

  // Verifica acesso baseado em role para rotas de loja
  const allowedStorePaths = ['/event', '/store/positivacao']; 
  if (user.role === 'store' && !allowedStorePaths.includes(pathname) && !pathname.startsWith('/_next/')) {
      return (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
            <p className="mb-4">Você não tem permissão para visualizar esta página.</p>
            <Button onClick={() => router.push('/store/positivacao')}>Ir para Minhas Positivações</Button>
          </div>
        );
  }

  // Verifica acesso baseado em role para rotas de vendedor
  const allowedVendorPaths = ['/event', '/vendor/positivacao'];
  if (user.role === 'vendor' && !allowedVendorPaths.includes(pathname) && !pathname.startsWith('/_next/')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="mb-4">Você não tem permissão para visualizar esta página.</p>
        <Button onClick={() => router.push('/vendor/positivacao')}>Ir para Positivar Loja</Button>
      </div>
    );
  }

  // Determina o título do cabeçalho móvel
  const mobileHeaderTitle = currentEvent?.name ? currentEvent.name : "Menu";

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4 md:hidden">
          {/* Mobile Sidebar Trigger */}
          <SidebarTrigger className="sm:hidden" /> 
          <h1 className="font-headline text-lg font-semibold truncate" title={mobileHeaderTitle}>{mobileHeaderTitle}</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
