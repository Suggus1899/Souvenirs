import {
  BellIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: HomeIcon },
  { href: "/clients", label: "Clientes", icon: UsersIcon },
  { href: "/services", label: "Servicios", icon: TagIcon },
  { href: "/bookings", label: "Reservas", icon: CalendarDaysIcon },
  { href: "/invoices", label: "Facturas", icon: DocumentTextIcon },
  { href: "/reminders", label: "Recordatorios", icon: BellIcon },
  { href: "/settings", label: "Configuración", icon: Cog6ToothIcon },
];
