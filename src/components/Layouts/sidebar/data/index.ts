import type { ComponentType } from "react";
import * as Icons from "../icons";

export interface NavSubItem { title: string; url: string; }
export interface NavItem { title: string; icon: ComponentType<Record<string, unknown>>; url?: string; items: NavSubItem[]; }
export interface NavSection { label: string; items: NavItem[]; }

export const ADMIN_NAV_DATA: NavSection[] = [
  {
    label: "PLATFORM",
    items: [
      {
        title: "Overview",
        url: "/admin",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Clients",
        url: "/admin/clients",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Tenants",
        url: "/admin/tenants",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Invite Clinic",
        url: "/admin/providers/onboard",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
  {
    label: "ACTIVITY",
    items: [
      {
        title: "Activity Log",
        url: "/admin/activity",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Bookings",
        url: "/admin/bookings",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Call Sessions",
        url: "/admin/calls",
        icon: Icons.Calendar,
        items: [],
      },
    ],
  },
];

export const PORTAL_NAV_DATA: NavSection[] = [
  {
    label: "MY CLINIC",
    items: [
      {
        title: "Dashboard",
        url: "/portal",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Setup Wizard",
        url: "/portal/setup",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Profile",
        url: "/portal/profile",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Opening Hours",
        url: "/portal/schedule",
        icon: Icons.Calendar,
        items: [],
      },
    ],
  },
  {
    label: "APPOINTMENTS",
    items: [
      {
        title: "Slots",
        url: "/portal/slots",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Bookings",
        url: "/portal/bookings",
        icon: Icons.PieChart,
        items: [],
      },
    ],
  },
];

// Fallback — used before role is known
export const NAV_DATA: NavSection[] = ADMIN_NAV_DATA;
