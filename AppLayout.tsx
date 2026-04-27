import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Button } from "./button";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  Clock,
  BarChart3,
  Menu,
  X,
  UserCircle,
  AtSign,
  FileImage,
  Tag,
  Globe,
  Inbox,
} from "lucide-react";
import { useState } from "react";
import { BackendHealth } from "./BackendHealth";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/log", label: "Log Incident", icon: PlusCircle },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/intake", label: "Intake", icon: Inbox },
  { path: "/persons", label: "Persons", icon: UserCircle },
  { path: "/aliases", label: "Aliases", icon: AtSign },
  { path: "/evidence", label: "Evidence", icon: FileImage },
  { path: "/tags", label: "Tags", icon: Tag },
  { path: "/platforms", label: "Platforms", icon: Globe },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Safety", icon: Shield },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <BackendHealth />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r bg-card fixed h-full z-10 overflow-y-auto">
        <div className="p-5 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-sm leading-tight">Curtain Drop Dossier</h1>
            <p className="text-[10px] text-muted-foreground">Operation Curtain Drop</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          {user && (
            <div className="px-3 py-1.5 mb-2">
              <p className="text-xs font-medium truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground">Private Mode</p>
            </div>
          )}
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card z-50 flex items-center gap-2 px-3">
        <div className="flex items-center gap-2 shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-background z-40 p-3 overflow-y-auto">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 pt-4 border-t px-4">
            <p className="text-xs font-medium">{user?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground mb-2">Private Mode</p>
          </div>
        </div>
      )}

      {/* Desktop top bar with search */}
      <div className="hidden lg:flex fixed top-0 left-56 right-0 h-14 border-b bg-card z-30 items-center gap-4 px-4">
        <div className="flex-1 max-w-md">
          <GlobalSearch />
        </div>
        <div className="ml-auto">
          <p className="text-xs text-muted-foreground">Private Mode</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pt-14">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
