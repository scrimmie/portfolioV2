import React, { useState, useRef, useEffect, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import { pageForPath } from "../lib/routes";

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
const MINIMIZED_SIZE = 40; // minimized icon (w-10 h-10)

// Compute a sensible centered starting box for the current viewport.
const getInitialWindowState = (): WindowState => {
  if (typeof window === "undefined") {
    return {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      isMinimized: false,
      isMaximized: false,
      prevState: null,
    };
  }
  const availHeight = window.innerHeight - TOP_BAR_HEIGHT - BOTTOM_NAV_HEIGHT;
  const width = Math.min(800, window.innerWidth * 0.8);
  const height = Math.min(600, availHeight * 0.9);
  return {
    x: (window.innerWidth - width) / 2,
    y: TOP_BAR_HEIGHT + (availHeight - height) / 2,
    width,
    height,
    isMinimized: false,
    isMaximized: false,
    prevState: null,
  };
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

  // References for DOM elements
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const minimizedRef = useRef<HTMLButtonElement>(null);

  // Drag state — transient values live in a ref so the move handler can stay
  // stable and be attached only for the duration of a drag.
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ offsetX: 0, offsetY: 0, width: 0, height: 0 });

  // Resize state — captured once at resize start and never mutated mid-gesture,
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
      return {
        x: iconRect.left + iconRect.width / 2 - MINIMIZED_SIZE / 2,
        y: iconRect.top - 60,
      };
    }
    return { x: 20, y: window.innerHeight - 100 };
  }, []);

  // Begin dragging the window from its title bar.
  const handleDragStart = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
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
    if (windowState.isMaximized) return;
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

  // Global drag/resize handlers — attached only while a gesture is active.
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
        Math.min(e.clientX - d.offsetX, window.innerWidth - MINIMIZED_SIZE)
      );
      const newY = Math.max(
        TOP_BAR_HEIGHT,
        Math.min(
          e.clientY - d.offsetY,
          window.innerHeight - BOTTOM_NAV_HEIGHT - MINIMIZED_SIZE
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

  // If window is minimized, show only the minimized icon
  if (windowState.isMinimized) {
    return (
      <button
        type="button"
        ref={minimizedRef}
        aria-label="Restore window"
        className="fixed z-50 cursor-grab active:cursor-grabbing flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/30 rounded-lg w-10 h-10 shadow-lg hover:bg-black/70 transition-all duration-300"
        style={{
          left: `${minimizedPos.x}px`,
          top: `${minimizedPos.y}px`,
        }}
        onMouseDown={handleMinimizedDragStart}
        onClick={handleMinimizedClick}
      >
        <div className="w-4 h-4 text-white/80 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      </button>
    );
  }

  // Main browser window render
  return (
    <div
      ref={windowRef}
      className="fixed z-40 shadow-2xl"
      style={{
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
      }}
    >
      <div className="flex h-full w-full flex-col border-2 border-zinc-400 bg-white">
        {/* Window header with controls */}
        <div
          ref={headerRef}
          className={`flex h-7 min-w-full flex-row border-b-2 border-zinc-400 bg-zinc-700 ${
            !windowState.isMaximized ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          onMouseDown={handleDragStart}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label="Close window"
            className="flex aspect-square w-7 flex-col items-center justify-center border-r border-zinc-400 p-1.5 hover:bg-red-500 transition-colors cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path
                fill="white"
                d="M17.414 16L24 9.414L22.586 8L16 14.586L9.414 8L8 9.414L14.586 16L8 22.586L9.414 24L16 17.414L22.586 24L24 22.586z"
              ></path>
            </svg>
          </button>

          {/* Minimize button */}
          <button
            type="button"
            aria-label="Minimize window"
            className="flex border-r border-zinc-400 p-1.5 w-min aspect-square hover:bg-yellow-500 transition-colors cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={minimizeWindow}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path
                fill="none"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 16h22"
              ></path>
            </svg>
          </button>

          {/* Maximize button */}
          <button
            type="button"
            aria-label={windowState.isMaximized ? "Restore window size" : "Maximize window"}
            className="flex items-center border-r border-zinc-400 p-1 hover:bg-green-500 transition-colors cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMaximize}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill="white"
                d="M4 2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3v2H5.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1H13v-2h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm8 13v2H8v-2zM3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
              ></path>
            </svg>
          </button>

          {/* URL bar */}
          <div className="flex aspect-square w-full flex-row items-center justify-center pr-12 font-JetbrainsMono text-white">
            <svg
              className="w-5 pr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="white"
                d="M6 9V7.25C6 3.845 8.503 1 12 1s6 2.845 6 6.25V9h.5a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-8A2.5 2.5 0 0 1 5.5 9Zm-1.5 2.5v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1m3-4.25V9h9V7.25c0-2.67-1.922-4.75-4.5-4.75c-2.578 0-4.5 2.08-4.5 4.75"
              ></path>
            </svg>
            <h1 className="text-sm">{url}</h1>
          </div>
        </div>

        {/* Window content acts as container for responsive queries */}
        <div
          className="flex-1 overflow-auto browser-content"
          style={{ containerType: "inline-size" } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Resize handles (hidden while maximized) */}
        {!windowState.isMaximized && (
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
    </div>
  );
};

export default BrowserWindow;
