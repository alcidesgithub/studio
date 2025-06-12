
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
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
          <Button onClick={() => router.push('/dashboard')}>Ir para o Painel</Button>
        </div>
      );
  }

  // Check role-based access for store routes
  const allowedStorePaths = ['/dashboard', '/event', '/store/positivacao'];
  if (user.role === 'store' && !allowedStorePaths.includes(pathname) && !pathname.startsWith('/_next/')) {
    // Check if the current path is a sub-path of any allowed path, which is not strictly necessary
    // for the current flat route structure but good for future-proofing if paths like /store/positivacao/details were added.
    // For now, a direct includes check is sufficient.
    // const isAllowedSubPath = allowedStorePaths.some(p => pathname.startsWith(p) && p !== pathname); 
    // if (!isAllowedSubPath) { // Simplified: if not in the exact allowed list
      return (
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
            <p className="mb-4">Você não tem permissão para visualizar esta página.</p>
            <Button onClick={() => router.push('/dashboard')}>Ir para o Painel</Button>
          </div>
        );
    // }
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
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
