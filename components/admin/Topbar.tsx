"use client";

import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.fullName || user?.firstName || 'Admin';
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-10 flex h-16 items-center justify-end gap-2 border-b border-border/60 bg-background/85 px-6 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/70',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      <Button
        variant="ghost"
        asChild
        className="hidden gap-2 text-sm text-muted-foreground hover:text-primary sm:flex"
      >
        <a href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://dmartbrandon.com"} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
          View storefront
        </a>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-xl hover:bg-secondary"
          >
            <Avatar className="h-8 w-8">
              {user?.imageUrl && (
                <AvatarImage src={user.imageUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: '/admin/login' })}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
