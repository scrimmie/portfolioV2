import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  TfiHome,
  TfiUser,
  TfiFolder,
  TfiCamera,
  TfiBrushAlt,
  TfiEmail,
} from "react-icons/tfi";
import { IoCode } from "react-icons/io5";
import type { ReactNode } from "react";
import { ROUTES, pageForPath, type AppRoute } from "../lib/routes";

// Icon per route, keyed by the route's stable `page` value.
const NAV_ICONS: Record<string, ReactNode> = {
  home: <TfiHome />,
  aboutme: <TfiUser />,
  development: <IoCode />,
  projects: <TfiFolder />,
  photography: <TfiCamera />,
  creative: <TfiBrushAlt />,
  contact: <TfiEmail />,
};

const RANGE = 140; // px over which magnification falls off
const MOBILE_BREAKPOINT = 640;

const DockIcon = ({
  route,
  mouseX,
  active,
  base,
  max,
}: {
  route: AppRoute;
  mouseX: MotionValue<number>;
  active: boolean;
  base: number;
  max: number;
}) => {
  const tileRef = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = tileRef.current?.getBoundingClientRect();
    if (!bounds) return RANGE + 1;
    return val - (bounds.left + bounds.width / 2);
  });
  // base === max on mobile → no magnification (there's no hover on touch).
  const sizeTarget = useTransform(distance, [-RANGE, 0, RANGE], [base, max, base]);
  const size = useSpring(sizeTarget, { mass: 0.1, stiffness: 210, damping: 16 });
  const iconSize = useTransform(size, (s) => s * 0.46);

  return (
    <a
      href={route.href}
      data-page={route.page}
      aria-label={route.name}
      title={route.name}
      className="group relative flex flex-col items-center justify-end"
    >
      {/* Hover tooltip */}
      <span className="pointer-events-none absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900/90 px-2 py-1 font-JetbrainsMono text-[11px] text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
        {route.name}
      </span>

      {/* Squircle tile — width & height animate so siblings reflow (no overlap) */}
      <motion.div
        ref={tileRef}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-[24%] border border-white/15 bg-gradient-to-b from-white/20 to-white/[0.06] text-white shadow-lg shadow-black/30"
      >
        <motion.span style={{ fontSize: iconSize }} className="leading-none">
          {NAV_ICONS[route.page]}
        </motion.span>
        <span className="pointer-events-none absolute inset-x-2 top-1.5 h-1/4 rounded-full bg-white/25 blur-[2px]" />
      </motion.div>

      {/* Running / active indicator dot */}
      <span
        className={`mt-1.5 h-1 w-1 rounded-full bg-white transition-opacity duration-200 ${
          active ? "opacity-90" : "opacity-0 group-hover:opacity-50"
        }`}
      />
    </a>
  );
};

export const Navigation = () => {
  const mouseX = useMotionValue(Infinity);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    setActivePage(pageForPath(window.location.pathname));
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Smaller, non-magnifying tiles on phones so all 7 fit a ~320px screen.
  const base = isMobile ? 38 : 44;
  const max = isMobile ? 38 : 74;

  return (
    <nav className="flex w-full justify-center">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`relative flex items-end rounded-2xl border border-white/10 bg-zinc-900/50 shadow-[0_10px_40px_-6px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl ${
          isMobile ? "gap-1.5 px-2 py-1.5" : "gap-3 px-3 py-2"
        }`}
      >
        {/* top edge highlight */}
        <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {ROUTES.map((route) => (
          <DockIcon
            key={route.page}
            route={route}
            mouseX={mouseX}
            active={activePage === route.page}
            base={base}
            max={max}
          />
        ))}
      </motion.div>
    </nav>
  );
};
