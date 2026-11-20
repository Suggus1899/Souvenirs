import { AppFooter } from "@/components/nav/app-footer";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { LogoutButton } from "@/components/nav/logout-button";
import { MobileNav } from "@/components/nav/mobile-nav";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Logo } from "@/components/brand/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Logo className="text-lg md:hidden" markClassName="size-6" />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
