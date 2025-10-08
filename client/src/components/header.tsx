import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Search, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/">
          <div
            className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3 cursor-pointer"
            data-testid="link-home"
          >
            <img
              src="/COTSensefavicon.png"
              alt="COTSense Logo"
              className="h-8 w-8 rounded-md object-contain bg-transparent"
            />
            <span className="text-lg font-semibold tracking-tight">
              COTSense
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/search">
            <Button
              variant={location.startsWith("/search") ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-search"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>

          <Link href="/admin">
            <Button
              variant={location === "/admin" ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-admin"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>

          <Link href="/about">
            <Button
              variant={location === "/about" ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-about"
            >
              <Info className="h-4 w-4 mr-2" />
              About
            </Button>
          </Link>

          <div className="ml-2 pl-2 border-l">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
