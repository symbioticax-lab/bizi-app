import { AuthBackground } from "@/components/auth/auth-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AuthBackground />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-6 py-10 sm:py-14">
        {children}
      </div>
    </div>
  );
}
