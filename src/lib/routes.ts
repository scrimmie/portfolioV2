// src/lib/routes.ts
// Single source of truth for the site's primary navigation routes.
// Shared by Navigation, MacTopBar, and BrowserWindow so the link list and the
// `data-page` keys (used to dock minimized windows) can never drift apart.

export interface AppRoute {
  name: string;
  href: string;
  /** Stable key used for `data-page` attributes and minimized-window docking. */
  page: string;
}

export const ROUTES: AppRoute[] = [
  { name: "Home", href: "/", page: "home" },
  { name: "About Me", href: "/aboutMe", page: "aboutme" },
  { name: "Development", href: "/development", page: "development" },
  { name: "Projects", href: "/projects", page: "projects" },
  { name: "Photography", href: "/photography", page: "photography" },
  { name: "Creative", href: "/creative", page: "creative" },
  { name: "Contact", href: "/contact", page: "contact" },
];

/** Resolve a pathname to its `data-page` key, defaulting to "home". */
export const pageForPath = (path: string): string =>
  ROUTES.find((route) => route.href === path)?.page ?? "home";
