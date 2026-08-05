import type { ComponentType } from "react";
import { Wallet, ListChecks, CalendarDays, BellRing, Dumbbell } from "lucide-react";

import GastosPage from "@/modules/gastos/routes";
import TarefasPage from "@/modules/tarefas/routes";
import CalendarioPage from "@/modules/calendario/routes";
import LembretesPage from "@/modules/lembretes/routes";
import TreinosPage from "@/modules/treinos/routes";

export interface ModuleConfig {
  id: string;
  label: string;
  /** Rota absoluta (com "/"), usada na navegação lateral. */
  path: string;
  icon: ComponentType<{ className?: string }>;
  element: ComponentType;
}

// Registo central dos módulos ativos. Adicionar um módulo novo ao site é
// só criar a pasta em src/modules/<nome>/ e acrescentar uma entrada aqui —
// a navegação lateral é gerada automaticamente a partir desta lista.
export const modules: ModuleConfig[] = [
  { id: "gastos", label: "Gastos", path: "/gastos", icon: Wallet, element: GastosPage },
  { id: "tarefas", label: "Tarefas", path: "/tarefas", icon: ListChecks, element: TarefasPage },
  { id: "calendario", label: "Calendário", path: "/calendario", icon: CalendarDays, element: CalendarioPage },
  { id: "lembretes", label: "Lembretes", path: "/lembretes", icon: BellRing, element: LembretesPage },
  { id: "treinos", label: "Treinos", path: "/treinos", icon: Dumbbell, element: TreinosPage },
];
