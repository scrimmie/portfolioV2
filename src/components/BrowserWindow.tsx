import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { navigate } from "astro:transitions/client";
import { ROUTES, pageForPath } from "../lib/routes";

interface BrowserWindowProps {
  url: string;
  children: React.ReactNode;
}

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  prevState: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

// Layout chrome the window must stay clear of (matches Layout.astro).
const TOP_BAR_HEIGHT = 24; // MacTopBar (h-6)
const BOTTOM_NAV_HEIGHT = 64; // Navigation dock (h-16)
const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const MINIMIZED_WIDTH = 140; // minimized window chip
const MINIMIZED_HEIGHT = 96;
// Below this viewport width the window goes full-bleed with no drag/resize.
const MOBILE_BREAKPOINT = 640;

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

// The window box: full-bleed on phones, centered ~80% on desktop.
const computeWindowBox = () => {
  const availHeight = window.innerHeight - TOP_BAR_HEIGHT - BOTTOM_NAV_HEIGHT;
  if (window.innerWidth < MOBILE_BREAKPOINT) {
    return {
      x: 0,
      y: TOP_BAR_HEIGHT,
      width: window.innerWidth,
      height: availHeight,
    };
  }
  const width = Math.min(800, window.innerWidth * 0.8);
  const height = Math.min(600, availHeight * 0.9);
  return {
    x: (window.innerWidth - width) / 2,
    y: TOP_BAR_HEIGHT + (availHeight - height) / 2,
    width,
    height,
  };
};

const getInitialWindowState = (): WindowState => {
  const box =
    typeof window === "undefined"
      ? { x: 0, y: 0, width: 800, height: 600 }
      : computeWindowBox();
  return { ...box, isMinimized: false, isMaximized: false, prevState: null };
};

export const BrowserWindow: React.FC<BrowserWindowProps> = ({
  url,
  children,
}) => {
  // Initialize lazily from the viewport so the window paints already centered
  // (this island is client:only, so `window` is always available here).
  const [windowState, setWindowState] = useState<WindowState>(
    getInitialWindowState
  );
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  // Keep the window full-bleed on phones and across rotation / chrome changes.
  useEffect(() => {
    let wasMobile = isMobileViewport();
    const onResize = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);
      // Re-fit while on mobile (rotation/chrome) and once when crossing the
      // breakpoint either way, but leave a user-positioned desktop window be.
      if (mobile || wasMobile) {
        setWindowState((prev) =>
          prev.isMinimized
            ? prev
            : { ...prev, ...computeWindowBox(), isMaximized: false }
        );
      }
      wasMobile = mobile;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // References for DOM elements
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const minimizedRef = useRef<HTMLButtonElement>(null);

  // Drag state, transient values live in a ref so the move handler can stay
  // stable and be attached only for the duration of a drag.
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ offsetX: 0, offsetY: 0, width: 0, height: 0 });

  // Resize state, captured once at resize start and never mutated mid-gesture,
  // so the anchored edge stays pinned.
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    corner: "bottom-right" | "bottom-left" | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    winX: number;
    winY: number;
  }>({ corner: null, startX: 0, startY: 0, startW: 0, startH: 0, winX: 0, winY: 0 });

  // Minimized icon docking position
  const [minimizedPos, setMinimizedPos] = useState({ x: 20, y: 0 });

  // Dock the minimized icon above the matching nav icon.
  const getNavIconPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: 20, y: 0 };
    const currentPage = pageForPath(window.location.pathname);
    const navIcon = document.querySelector(`a[data-page="${currentPage}"]`);
    if (navIcon) {
      const iconRect = navIcon.getBoundingClientRect();
      const centeredX = iconRect.left + iconRect.width / 2 - MINIMIZED_WIDTH / 2;
      return {
        x: Math.max(8, Math.min(centeredX, window.innerWidth - MINIMIZED_WIDTH - 8)),
        y: iconRect.top - MINIMIZED_HEIGHT - 18,
      };
    }
    return {
      x: 20,
      y: window.innerHeight - BOTTOM_NAV_HEIGHT - MINIMIZED_HEIGHT - 18,
    };
  }, []);

  // Begin dragging the window from its title bar.
  const handleDragStart = (e: React.MouseEvent) => {
    if (windowState.isMaximized || isMobile) return;
    e.preventDefault();

    const rect = headerRef.current?.getBoundingClientRect();
    dragRef.current = {
      offsetX: rect ? e.clientX - rect.left : 0,
      offsetY: rect ? e.clientY - rect.top : 0,
      width: windowState.width,
      height: windowState.height,
    };
    setIsDragging(true);
  };

  // Begin resizing from a bottom corner.
  const handleResizeStart = (
    e: React.MouseEvent,
    corner: "bottom-right" | "bottom-left"
  ) => {
    if (windowState.isMaximized || isMobile) return;
    e.preventDefault();
    e.stopPropagation();

    resizeRef.current = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startW: windowState.width,
      startH: windowState.height,
      winX: windowState.x,
      winY: windowState.y,
    };
    setIsResizing(true);
  };

  // Global drag/resize handlers, attached only while a gesture is active.
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const { offsetX, offsetY, width, height } = dragRef.current;
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - BOTTOM_NAV_HEIGHT - height;
        const newX = Math.max(0, Math.min(e.clientX - offsetX, maxX));
        const newY = Math.max(
          TOP_BAR_HEIGHT,
          Math.min(e.clientY - offsetY, maxY)
        );
        setWindowState((prev) => ({ ...prev, x: newX, y: newY }));
        return;
      }

      const r = resizeRef.current;
      if (!isResizing || !r.corner) return;

      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      const maxBottom = window.innerHeight - BOTTOM_NAV_HEIGHT;

      if (r.corner === "bottom-right") {
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(r.startW + dx, window.innerWidth - r.winX)
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(r.startH + dy, maxBottom - r.winY)
        );
        setWindowState((prev) => ({ ...prev, width: newWidth, height: newHeight }));
      } else {
        // bottom-left: pin the right edge, grow/shrink from the left.
        const rightEdge = r.winX + r.startW;
        const newX = Math.max(
          0,
          Math.min(r.winX + dx, rightEdge - MIN_WIDTH)
        );
        const newWidth = rightEdge - newX;
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(r.startH + dy, maxBottom - r.winY)
        );
        setWindowState((prev) => ({
          ...prev,
          x: newX,
          width: newWidth,
          height: newHeight,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeRef.current.corner = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // Minimized icon dragging (distinct from a click-to-restore).
  const [isDraggingMinimized, setIsDraggingMinimized] = useState(false);
  const minimizedDragRef = useRef({
    offsetX: 0,
    offsetY: 0,
    startClientX: 0,
    startClientY: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);

  const handleMinimizedDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = minimizedRef.current?.getBoundingClientRect();
    minimizedDragRef.current = {
      offsetX: rect ? e.clientX - rect.left : 0,
      offsetY: rect ? e.clientY - rect.top : 0,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };
    setIsDraggingMinimized(true);
  };

  useEffect(() => {
    if (!isDraggingMinimized) return;

    const handleMove = (e: MouseEvent) => {
      const d = minimizedDragRef.current;
      if (
        Math.abs(e.clientX - d.startClientX) > 4 ||
        Math.abs(e.clientY - d.startClientY) > 4
      ) {
        d.moved = true;
      }
      const newX = Math.max(
        0,
        Math.min(e.clientX - d.offsetX, window.innerWidth - MINIMIZED_WIDTH)
      );
      const newY = Math.max(
        TOP_BAR_HEIGHT,
        Math.min(
          e.clientY - d.offsetY,
          window.innerHeight - BOTTOM_NAV_HEIGHT - MINIMIZED_HEIGHT
        )
      );
      setMinimizedPos({ x: newX, y: newY });
    };

    const handleUp = () => {
      // If the icon actually moved, swallow the click that follows mouseup so a
      // drag doesn't also restore the window.
      if (minimizedDragRef.current.moved) suppressClickRef.current = true;
      setIsDraggingMinimized(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingMinimized]);

  // Window control handlers
  const handleClose = useCallback(() => {
    navigate("/");
  }, []);

  const minimizeWindow = () => {
    setMinimizedPos(getNavIconPosition());
    setWindowState((prev) => ({
      ...prev,
      isMinimized: true,
      prevState: {
        x: prev.x,
        y: prev.y,
        width: prev.width,
        height: prev.height,
      },
    }));
  };

  const restoreWindow = useCallback(() => {
    setWindowState((prev) => ({
      ...prev,
      isMinimized: false,
      x: prev.prevState?.x ?? prev.x,
      y: prev.prevState?.y ?? prev.y,
      width: prev.prevState?.width ?? prev.width,
      height: prev.prevState?.height ?? prev.height,
    }));
  }, []);

  const handleMinimizedClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    restoreWindow();
  };

  const handleMaximize = () => {
    setWindowState((prev) => {
      if (!prev.isMaximized) {
        return {
          ...prev,
          isMaximized: true,
          prevState: {
            x: prev.x,
            y: prev.y,
            width: prev.width,
            height: prev.height,
          },
          x: 0,
          y: TOP_BAR_HEIGHT,
          width: window.innerWidth,
          height: window.innerHeight - TOP_BAR_HEIGHT - BOTTOM_NAV_HEIGHT,
        };
      }
      return {
        ...prev,
        isMaximized: false,
        x: prev.prevState?.x ?? 0,
        y: prev.prevState?.y ?? TOP_BAR_HEIGHT,
        width: prev.prevState?.width ?? 800,
        height: prev.prevState?.height ?? 600,
      };
    });
  };

  // If window is minimized, show a small "minimized window" chip docked above
  // its matching nav icon.
  if (windowState.isMinimized) {
    const minimizedTitle =
      (typeof window !== "undefined"
        ? ROUTES.find((r) => r.page === pageForPath(window.location.pathname))
            ?.name
        : null) ?? "Window";

    return (
      <motion.button
        type="button"
        ref={minimizedRef}
        aria-label={`Restore ${minimizedTitle} window`}
        initial={{ scale: 0.55, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="group fixed z-50 flex cursor-grab flex-col overflow-hidden rounded-xl border border-white/15 bg-zinc-900/70 text-left shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/10 backdrop-blur-xl transition-shadow duration-300 hover:ring-white/30 active:cursor-grabbing"
        style={{
          left: `${minimizedPos.x}px`,
          top: `${minimizedPos.y}px`,
          width: `${MINIMIZED_WIDTH}px`,
          height: `${MINIMIZED_HEIGHT}px`,
        }}
        onMouseDown={handleMinimizedDragStart}
        onClick={handleMinimizedClick}
      >
        {/* mini title bar */}
        <div className="flex h-5 flex-shrink-0 items-center gap-1.5 border-b border-white/10 bg-white/[0.06] px-2.5">
          <span className="h-[7px] w-[7px] rounded-full bg-[#ff5f57]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#febc2e]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#28c840]" />
          <span className="ml-1 truncate font-JetbrainsMono text-[8px] text-white/45">
            {url}
          </span>
        </div>

        {/* body */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-1 px-2">
          <span className="font-JetbrainsMono text-[11px] font-semibold tracking-wide text-white/85">
            {minimizedTitle}
          </span>
          <span className="flex items-center gap-1 font-JetbrainsMono text-[8.5px] text-cyan-300/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2.5 w-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            click to restore
          </span>
        </div>

        {/* hover glow */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </motion.button>
    );
  }

  // Main browser window render
  return (
    <div
      ref={windowRef}
      className="fixed z-40"
      style={{
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
      }}
    >
      <div
        className={`flex h-full w-full flex-col overflow-hidden border border-white/10 bg-white shadow-2xl ring-1 ring-inset ring-white/10 ${
          isMobile ? "" : "rounded-xl"
        }`}
      >
        {/* Window title bar */}
        <div
          ref={headerRef}
          className={`group/lights relative flex h-8 min-w-full flex-shrink-0 flex-row items-center border-b border-white/10 bg-zinc-800/90 backdrop-blur-xl ${
            !windowState.isMaximized && !isMobile
              ? "cursor-grab active:cursor-grabbing"
              : ""
          }`}
          onMouseDown={handleDragStart}
        >
          {/* Traffic-light controls */}
          <div
            className="z-10 flex items-center gap-2 px-3.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close window"
              onClick={handleClose}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] shadow-sm transition hover:brightness-110"
            >
              <svg
                className="h-2 w-2 text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Minimize window"
              onClick={minimizeWindow}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#febc2e] shadow-sm transition hover:brightness-110"
            >
              <svg
                className="h-2 w-2 text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2.5 5h5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={
                windowState.isMaximized ? "Restore window size" : "Maximize window"
              }
              onClick={handleMaximize}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#28c840] shadow-sm transition hover:brightness-110"
            >
              <svg
                className="h-2 w-2 text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 2.5v5M2.5 5h5" />
              </svg>
            </button>
          </div>

          {/* URL, absolutely centered so the controls don't push it off-center */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 px-24 font-JetbrainsMono text-white/70">
            <svg
              className="h-3 w-3 flex-shrink-0 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M6 9V7.25C6 3.845 8.503 1 12 1s6 2.845 6 6.25V9h.5a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-8A2.5 2.5 0 0 1 5.5 9Zm-1.5 2.5v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1m3-4.25V9h9V7.25c0-2.67-1.922-4.75-4.5-4.75c-2.578 0-4.5 2.08-4.5 4.75"
              />
            </svg>
            <span className="truncate text-xs">{url}</span>
          </div>
        </div>

        {/* Window content acts as container for responsive queries */}
        <div
          className="flex-1 overflow-auto browser-content"
          style={{ containerType: "inline-size" } as React.CSSProperties}
        >
          {children}
        </div>

      </div>

      {/* Resize handles, outside the clipped chrome so the corners stay grabbable */}
      {!windowState.isMaximized && !isMobile && (
        <>
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
          />
        </>
      )}
    </div>
  );
};

export default BrowserWindow;
