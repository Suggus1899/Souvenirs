import { AppFooter } from "@/components/nav/app-footer";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { LogoutButton } from "@/components/nav/logout-button";
import { MobileNav } from "@/components/nav/mobile-nav";
import { ThemeToggle } from "@/components/nav/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="font-heading text-lg md:hidden">Souvenirs</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
