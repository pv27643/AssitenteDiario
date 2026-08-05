import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { modules } from "@/modules.config";
import { useAuth } from "@/shared/context/AuthContext";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  end: boolean;
}

// Mesma lista de navegação a alimentar a sidebar (md+) e a barra inferior
// (ecrãs estreitos) — dashboard fixo + um item por módulo ativo.
const navItems: NavItem[] = [
  { id: "dashboard", label: "Início", path: "/", icon: Home, end: true },
  ...modules.map(
    (module): NavItem => ({
      id: module.id,
      label: module.label,
      path: module.path,
      icon: module.icon,
      end: false,
    }),
  ),
];

function sidebarLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
  }`;
}

function bottomNavLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
    isActive ? "bg-red-500/10 text-red-500" : "text-zinc-500 hover:text-zinc-300"
  }`;
}

export default function Layout() {
  const { profile, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar — a partir do breakpoint md */}
      <aside className="hidden w-64 flex-col border-r border-zinc-800 px-4 py-6 md:flex">
        <div className="mb-8 px-2 text-lg font-semibold text-white">Assistente Diário</div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.id} to={item.path} end={item.end} className={sidebarLinkClass}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-800 pt-4">
          {profile && <div className="mb-2 px-2 text-sm text-zinc-500">{profile.username}</div>}
          <button
            type="button"
            onClick={() => logout()}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Cabeçalho — só em ecrã estreito, dá acesso ao logout sem sidebar */}
        <header className="flex min-h-14 items-center justify-between border-b border-zinc-800 px-4 md:hidden">
          <span className="text-base font-semibold text-white">Assistente Diário</span>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sair"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>

        {/* Barra de separadores flutuante — só em ecrã estreito */}
        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-3 md:hidden"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
        >
          <div className="flex w-full max-w-md items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-lg shadow-black/40 backdrop-blur">
            {navItems.map((item) => (
              <NavLink key={item.id} to={item.path} end={item.end} className={bottomNavLinkClass}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
