
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, LogOut, Users, Award, Gift, Store, ShoppingBag, MapPin, Settings, UserCircle, LayoutDashboard, Building, ThumbsUp, Star, ListChecks, Download, UsersCog, Trophy, Edit3, ClipboardPlus, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItemsByRole = {
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/event', label: 'Event Info', icon: MapPin },
    { group: 'Management' },
    { href: '/admin/event-management', label: 'Event Management', icon: Edit3 },
    { href: '/admin/users', label: 'User Management', icon: UsersCog },
    { href: '/admin/awards', label: 'Award Tiers', icon: Trophy },
    { href: '/admin/sweepstakes', label: 'Sweepstakes', icon: Gift },
    { href: '/admin/store-registration', label: 'Register Store', icon: ClipboardPlus },
    { href: '/admin/vendor-management', label: 'Vendor Management', icon: Briefcase },
  ],
  manager: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/event', label: 'Event Info', icon: MapPin },
    { href: '/admin/sweepstakes', label: 'Run Sweepstakes', icon: Gift },
    { href: '/admin/vendor-management', label: 'Vendor Management', icon: Briefcase },
  ],
  vendor: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/event', label: 'Event Info', icon: MapPin },
    { href: '/vendor/positivacao', label: 'Positivar Store', icon: ThumbsUp },
  ],
  store: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/event', label: 'Event Info', icon: MapPin },
    { href: '/store/positivacao', label: 'My Scorecard', icon: Star },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setOpenMobile } = useSidebar();

  const navItems = user?.role ? navItemsByRole[user.role] : [];

  const handleLinkClick = () => {
    setOpenMobile(false); // Close mobile sidebar on link click
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
                <Link href={item.href!} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    variant="default"
                    size="default"
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    onClick={handleLinkClick}
                    className="justify-start"
                  >
                    <a> {/* Content of the button is <a> tag due to asChild */}
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
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
              <p className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={logout}>
          <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
          <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </div>
    </>
  );
}
