import { useState, useEffect, useRef } from "react";
import { HiDesktopComputer, HiVolumeUp } from "react-icons/hi";
import { BsBatteryFull, BsHeadphones } from "react-icons/bs";
import { ROUTES } from "../lib/routes";

export const MacTopBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close the dropdown when clicking outside it or pressing Escape
  useEffect(() => {
    if (!showDropdown) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDropdown(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 h-6 flex items-center justify-between px-3 text-xs text-white font-JetbrainsMono">
      {/* Left side - Computer menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-1 hover:bg-gray-700/50 px-2 py-1 rounded transition-colors"
          aria-label="Open navigation menu"
          aria-haspopup="menu"
          aria-expanded={showDropdown}
        >
          <HiDesktopComputer className="w-3 h-3" />
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            role="menu"
            className="absolute top-full left-0 mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg min-w-48 py-1"
          >
            {ROUTES.map((item) => (
              <a
                key={item.page}
                href={item.href}
                role="menuitem"
                className="block px-3 py-1 hover:bg-gray-700/50 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="border-t border-gray-700 my-1"></div>
            <div className="px-3 py-1 text-gray-400">Technology is cool!</div>
          </div>
        )}
      </div>

      {/* Right side - System status */}
      <div className="flex items-center space-x-3">
        {/* Headphones icon */}
        <div className="flex items-center text-green-400">
          <BsHeadphones className="w-3 h-3" />
        </div>

        {/* Sound icon */}
        <div className="flex items-center">
          <HiVolumeUp className="w-3 h-3" />
        </div>

        {/* Battery icon */}
        <div className="flex items-center text-green-400">
          <BsBatteryFull className="w-3 h-3" />
          <span className="ml-1">87%</span>
        </div>

        {/* Date and Time */}
        <div className="flex items-center space-x-2">
          <span>{formatDate(currentTime)}</span>
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
};
