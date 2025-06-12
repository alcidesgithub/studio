
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, MapPin, Settings, UserCircle, LayoutDashboard, Building, ThumbsUp, Star, ListChecks, Download, UserCog, Trophy, Edit3, ClipboardPlus, Briefcase, Dice6 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLES_TRANSLATIONS } from '@/lib/constants';

const navItemsByRole = {
  admin: [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/event', label: 'Info Evento', icon: MapPin },
    { group: 'Gerenciamento' },
    { href: '/admin/event-management', label: 'Gerenciar Evento', icon: Edit3 },
    { href: '/admin/users', label: 'Usuários', icon: UserCog },
    { href: '/admin/awards', label: 'Premiação', icon: Trophy },
    { href: '/admin/sweepstakes-by-tier', label: 'Sorteios', icon: Dice6 },
    { href: '/admin/store-registration', label: 'Lojas', icon: ClipboardPlus },
    { href: '/admin/vendor-management', label: 'Fornecedores', icon: Briefcase },
  ],
  manager: [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/event', label: 'Info Evento', icon: MapPin },
    { href: '/admin/sweepstakes-by-tier', label: 'Sorteios', icon: Dice6 },
    { href: '/admin/vendor-management', label: 'Fornecedores', icon: Briefcase },
  ],
  vendor: [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/event', label: 'Info Evento', icon: MapPin },
    { href: '/vendor/positivacao', label: 'Positivar Loja', icon: ThumbsUp },
  ],
  store: [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/event', label: 'Info Evento', icon: MapPin },
    { href: '/store/positivacao', label: 'Minha Cartela', icon: Star },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setOpenMobile, state: sidebarState, isMobile } = useSidebar(); 

  const navItems = user?.role ? navItemsByRole[user.role] : [];

  const handleLinkClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Building className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Hiperfarma
          </h1>
        </Link>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarMenu className="p-4 space-y-2">
          {navItems.map((item, index) => (
            item.group ? (
              <SidebarGroupLabel key={`group-${index}`} className="mt-4 pt-2 text-xs uppercase text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                {item.group}
              </SidebarGroupLabel>
            ) : (
              <SidebarMenuItem key={item.href}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href!}>
                        <SidebarMenuButton
                          variant="default"
                          size="default"
                          isActive={pathname === item.href}
                          onItemClick={handleLinkClick} 
                          className="justify-start"
                        >
                          {item.icon && <item.icon className="h-5 w-5" />}
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" hidden={sidebarState !== "collapsed" || isMobile}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            )
          ))}
        </SidebarMenu>
      </ScrollArea>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        {user && (
          <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://placehold.co/100x100.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="user avatar" />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">{ROLES_TRANSLATIONS[user.role] || user.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-sidebar-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
          <span className="ml-2 group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </div>
    </>
  );
}

