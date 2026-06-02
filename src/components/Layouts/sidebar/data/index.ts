import * as Icons from "../icons";

export const ADMIN_NAV_DATA = [
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
        title: "Tenants",
        url: "/admin/tenants",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Providers",
        icon: Icons.User,
        items: [
          { title: "All Providers", url: "/admin/providers" },
          { title: "Onboard New", url: "/admin/providers/onboard" },
        ],
      },
    ],
  },
  {
    label: "ACTIVITY",
    items: [
      {
        title: "Bookings",
        url: "/admin/bookings",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Call Sessions",
        url: "/admin/calls",
        icon: Icons.PieChart,
        items: [],
      },
    ],
  },
];

export const PORTAL_NAV_DATA = [
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
export const NAV_DATA = ADMIN_NAV_DATA;
