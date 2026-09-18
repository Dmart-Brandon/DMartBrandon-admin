"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isLoaded, user, pathname, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user && user.unsafeMetadata?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/40 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            Your account does not have admin privileges. Contact an administrator if you believe this is a mistake.
          </p>
          <Button
            variant="outline"
            onClick={() => signOut({ redirectUrl: '/admin/login' })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
