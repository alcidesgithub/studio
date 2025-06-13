
"use client";
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary hidden sm:block" />}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">{title}</h1>
            {description && <p className="text-sm sm:text-base text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
