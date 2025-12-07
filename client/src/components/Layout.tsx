import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, DollarSign, Truck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/sales", icon: Truck, label: "Quick Log" },
    { href: "/expenses", icon: Receipt, label: "Expenses" },
  ];

  const NavContent = () => (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group cursor-pointer",
              isActive 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                : "hover:bg-slate-800 hover:text-white border border-transparent text-slate-500"
            )}>
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
              <DollarSign className="w-5 h-5 stroke-[3]" />
            </div>
            LogiTrack
          </h1>
        </div>
        
        <div className="flex-1 p-4">
          <NavContent />
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Mockup Mode Active</p>
          <p className="mt-1">v0.1.0-alpha</p>
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
              <DollarSign className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LogiTrack</span>
          </div>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-800 hover:text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900 border-slate-800 p-0 text-slate-300">
              <SheetHeader className="p-6 border-b border-slate-800 text-left">
                <SheetTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                   <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
                    <DollarSign className="w-5 h-5 stroke-[3]" />
                  </div>
                  LogiTrack
                </SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <NavContent />
              </div>
              <div className="p-4 border-t border-slate-800 text-xs text-slate-500 absolute bottom-0 w-full">
                <p>Mockup Mode Active</p>
                <p className="mt-1">v0.1.0-alpha</p>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
