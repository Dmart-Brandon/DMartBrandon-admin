import { SignIn } from '@clerk/nextjs';
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-green-950 p-4 text-green-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.22),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.18),transparent_50%)]" />

      <div className="relative flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:justify-between">
        <div className="hidden max-w-md lg:block">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-300">
              <Leaf className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              DMartBrandon <span className="text-green-300">Admin</span>
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
            Manage your farm-fresh storefront.
          </h2>
          <p className="mt-4 text-sm text-green-200/80">
            Sign in to update products, review orders from customers, and
            oversee daily operations for DMartBrandon Fresh.
          </p>
        </div>

        <SignIn fallbackRedirectUrl="/admin/dashboard" />
      </div>
    </div>
  );
}
