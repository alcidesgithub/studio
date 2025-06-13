
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SheetTitle } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback:
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4">Redirecionando para o login...</p>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check role-based access for admin routes
  if (pathname.startsWith('/admin') && !['admin', 'manager'].includes(user.role)) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="mb-4">Você não tem permissão para visualizar esta página.</p>
          <Button onClick={() => router.push(user.role === 'store' ? '/store/positivacao' : (user.role === 'vendor' ? '/vendor/positivacao' : '/dashboard'))}>Ir para Página Inicial</Button>
        </div>
      );
  }

  // Check role-based access for store routes
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

  // Check role-based access for vendor routes
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


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4 md:hidden">
          {/* Mobile Sidebar Trigger */}
          <SidebarTrigger className="sm:hidden" /> 
          <h1 className="font-headline text-lg font-semibold">Hiperfarma BMM</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
