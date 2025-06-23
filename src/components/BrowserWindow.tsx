import React, { useState, useRef, useEffect } from "react";

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

export const BrowserWindow: React.FC<BrowserWindowProps> = ({
  url,
  children,
}) => {
  // Track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  // Initialize window state
  const [windowState, setWindowState] = useState<WindowState>({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    isMinimized: false,
    isMaximized: false,
    prevState: null,
  });

  // References for DOM elements
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const minimizedRef = useRef<HTMLDivElement>(null);

  // State for drag operations
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // State for resize operations
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<
    "bottom-right" | "bottom-left" | null
  >(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Track if we're on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle minimized icon initial position - dock to corresponding nav icon
  const [minimizedPos, setMinimizedPos] = useState({ x: 20, y: 0 });

  // Function to get corresponding nav icon position
  const getNavIconPosition = () => {
    if (!isMounted) return { x: 20, y: window.innerHeight - 100 };

    // Map URL to page data attributes
    const urlToPage: { [key: string]: string } = {
      "/": "home",
      "/aboutMe": "aboutme",
      "/development": "development",
      "/projects": "projects",
      "/photography": "photography",
      "/creative": "creative",
      "/contact": "contact",
    };

    const currentPath = window.location.pathname;
    const currentPage = urlToPage[currentPath] || "home";

    // Find the navigation icon element
    const navIcon = document.querySelector(`a[data-page="${currentPage}"]`);

    if (navIcon) {
      const iconRect = navIcon.getBoundingClientRect();
      // Position the minimized window slightly above the icon
      return {
        x: iconRect.left + iconRect.width / 2 - 24, // Center on icon (24 = half of minimized window width)
        y: iconRect.top - 60, // Position above the icon
      };
    }

    // Fallback position
    return { x: 20, y: window.innerHeight - 100 };
  };

  useEffect(() => {
    if (isMounted) {
      const position = getNavIconPosition();
      setMinimizedPos(position);
    }
  }, [isMounted]);

  // Update minimized position when window is minimized
  useEffect(() => {
    if (windowState.isMinimized && isMounted) {
      const position = getNavIconPosition();
      setMinimizedPos(position);
    }
  }, [windowState.isMinimized, isMounted]);

  // Initialize window position in the center of the viewport
  useEffect(() => {
    if (
      isMounted &&
      windowRef.current &&
      !windowState.isMinimized &&
      !windowState.isMaximized
    ) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight - 64; // Accounting for navbar height
      const initialWidth = Math.min(800, viewportWidth * 0.8);
      const initialHeight = Math.min(600, viewportHeight * 0.8);

      setWindowState((prev) => ({
        ...prev,
        x: (viewportWidth - initialWidth) / 2,
        y: (viewportHeight - initialHeight) / 2,
        width: initialWidth,
        height: initialHeight,
      }));
    }
  }, [isMounted]);

  // Handle window dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = headerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle window resizing
  const handleResizeStart = (
    e: React.MouseEvent,
    corner: "bottom-right" | "bottom-left"
  ) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeCorner(corner);
    setResizeStartPos({ x: e.clientX, y: e.clientY });

    if (windowRef.current) {
      setResizeStartDimensions({
        width: windowRef.current.offsetWidth,
        height: windowRef.current.offsetHeight,
      });
    }
  };

  // Global mouse event handlers for drag and resize
  useEffect(() => {
    if (!isMounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      // Handle window dragging
      if (isDragging && !windowState.isMaximized) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 64; // Accounting for navbar height

        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // Prevent window from going outside viewport
        newX = Math.max(0, Math.min(newX, viewportWidth - windowState.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - windowState.height));

        setWindowState((prev) => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      }

      // Handle window resizing
      if (isResizing && resizeCorner) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 64; // Accounting for navbar height

        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        const minWidth = 300;
        const minHeight = 200;

        if (resizeCorner === "bottom-right") {
          let newWidth = resizeStartDimensions.width + deltaX;
          let newHeight = resizeStartDimensions.height + deltaY;

          // Apply constraints
          newWidth = Math.max(
            minWidth,
            Math.min(newWidth, viewportWidth - windowState.x)
          );
          newHeight = Math.max(
            minHeight,
            Math.min(newHeight, viewportHeight - windowState.y)
          );

          setWindowState((prev) => ({
            ...prev,
            width: newWidth,
            height: newHeight,
          }));
        } else if (resizeCorner === "bottom-left") {
          let newWidth = resizeStartDimensions.width - deltaX;
          let newHeight = resizeStartDimensions.height + deltaY;
          let newX = windowState.x + deltaX;

          // Apply constraints
          newWidth = Math.max(
            minWidth,
            Math.min(newWidth, windowState.x + resizeStartDimensions.width)
          );
          newHeight = Math.max(
            minHeight,
            Math.min(newHeight, viewportHeight - windowState.y)
          );
          newX = Math.min(
            newX,
            windowState.x + resizeStartDimensions.width - minWidth
          );
          newX = Math.max(0, newX);

          setWindowState((prev) => ({
            ...prev,
            x: newX,
            width: newWidth,
            height: newHeight,
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeCorner(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isMounted,
    isDragging,
    dragOffset,
    windowState.isMaximized,
    windowState.width,
    windowState.height,
    windowState.x,
    windowState.y,
    isResizing,
    resizeCorner,
    resizeStartPos,
    resizeStartDimensions,
  ]);

  // Handle minimized icon dragging
  const [isDraggingMinimized, setIsDraggingMinimized] = useState(false);

  const [minimizedDragOffset, setMinimizedDragOffset] = useState({
    x: 0,
    y: 0,
  });

  const handleMinimizedDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingMinimized(true);

    const rect = minimizedRef.current?.getBoundingClientRect();
    if (rect) {
      setMinimizedDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const handleMinimizedMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimized) {
        e.preventDefault();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - 64; // Accounting for navbar height

        const iconSize = 48; // Size of minimized icon

        let newX = e.clientX - minimizedDragOffset.x;
        let newY = e.clientY - minimizedDragOffset.y;

        // Prevent minimized icon from going outside viewport
        newX = Math.max(0, Math.min(newX, viewportWidth - iconSize));
        newY = Math.max(0, Math.min(newY, viewportHeight - iconSize));

        setMinimizedPos({ x: newX, y: newY });
      }
    };

    const handleMinimizedMouseUp = () => {
      setIsDraggingMinimized(false);
    };

    if (isDraggingMinimized) {
      document.addEventListener("mousemove", handleMinimizedMouseMove);
      document.addEventListener("mouseup", handleMinimizedMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMinimizedMouseMove);
      document.removeEventListener("mouseup", handleMinimizedMouseUp);
    };
  }, [isMounted, isDraggingMinimized, minimizedDragOffset]);

  // Window control handlers
  const handleClose = () => {
    // Navigate to home page - only when client-side
    if (isMounted) {
      window.location.href = "/";
    }
  };

  const handleMinimize = () => {
    if (!windowState.isMinimized) {
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
    } else {
      setWindowState((prev) => ({
        ...prev,
        isMinimized: false,
        x: prev.prevState?.x || prev.x,
        y: prev.prevState?.y || prev.y,
        width: prev.prevState?.width || prev.width,
        height: prev.prevState?.height || prev.height,
      }));
    }
  };

  const handleMaximize = () => {
    if (!isMounted) return;

    if (!windowState.isMaximized) {
      // Save current state before maximizing
      setWindowState((prev) => ({
        ...prev,
        isMaximized: true,
        prevState: {
          x: prev.x,
          y: prev.y,
          width: prev.width,
          height: prev.height,
        },
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - 64, // Account for navbar
      }));
    } else {
      // Restore previous state
      setWindowState((prev) => ({
        ...prev,
        isMaximized: false,
        x: prev.prevState?.x || 0,
        y: prev.prevState?.y || 0,
        width: prev.prevState?.width || 800,
        height: prev.prevState?.height || 600,
      }));
    }
  };

  // If window is minimized, show only the minimized icon
  if (windowState.isMinimized) {
    return (
      <div
        ref={minimizedRef}
        className="fixed z-50 cursor-grab active:cursor-grabbing flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/30 rounded-lg w-10 h-10 shadow-lg hover:bg-black/70 transition-all duration-300"
        style={{
          left: `${minimizedPos.x}px`,
          top: `${minimizedPos.y}px`,
        }}
        onMouseDown={handleMinimizedDragStart}
        onClick={handleMinimize}
      >
        <div className="w-4 h-4 text-white/80 group-hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      </div>
    );
  }

  // Main browser window render
  return (
    <div
      ref={windowRef}
      className="absolute z-40 shadow-2xl"
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
          <div
            className="flex aspect-square w-7 flex-col items-center justify-center border-r border-zinc-400 p-1.5 hover:bg-red-500 transition-colors cursor-pointer"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 32 32"
            >
              <path
                fill="white"
                d="M17.414 16L24 9.414L22.586 8L16 14.586L9.414 8L8 9.414L14.586 16L8 22.586L9.414 24L16 17.414L22.586 24L24 22.586z"
              ></path>
            </svg>
          </div>

          {/* Minimize button */}
          <div
            className="flex border-r border-zinc-400 p-1.5 w-min aspect-square hover:bg-yellow-500 transition-colors cursor-pointer"
            onClick={handleMinimize}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 32 32"
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
          </div>

          {/* Maximize button */}
          <div
            className="border-r border-zinc-400 p-1 hover:bg-green-500 transition-colors cursor-pointer"
            onClick={handleMaximize}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 20 20"
            >
              <path
                fill="white"
                d="M4 2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3v2H5.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1H13v-2h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm8 13v2H8v-2zM3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
              ></path>
            </svg>
          </div>

          {/* URL bar */}
          <div className="flex aspect-square w-full flex-row items-center justify-center pr-12 font-JetbrainsMono text-white">
            <svg
              className="w-5 pr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
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
          style={{ containerType: "inline-size" as any }}
        >
          {children}
        </div>

        {/* Resize handle - bottom right */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
        />

        {/* Resize handle - bottom left */}
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
          onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
        />
      </div>
    </div>
  );
};

export default BrowserWindow;
