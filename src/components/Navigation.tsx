import {
  TfiHome,
  TfiUser,
  TfiFolder,
  TfiCamera,
  TfiBrushAlt,
  TfiEmail,
} from "react-icons/tfi";
import { IoCode } from "react-icons/io5";

export const Navigation = () => {
  const navLinks = [
    { name: "Home", href: "/", id: 1, icon: <TfiHome /> },
    { name: "About Me", href: "/aboutMe", id: 2, icon: <TfiUser /> },
    { name: "Development", href: "/development", id: 3, icon: <IoCode /> },
    { name: "Projects", href: "/projects", id: 4, icon: <TfiFolder /> },
    { name: "Photography", href: "/photography", id: 5, icon: <TfiCamera /> },
    { name: "Creative", href: "/creative", id: 6, icon: <TfiBrushAlt /> },
    { name: "Contact", href: "/contact", id: 7, icon: <TfiEmail /> },
  ];

  return (
    <nav className="w-full flex justify-center">
      {/* Dock container */}
      <div className="relative">
        {/* Dock background with glassmorphism effect */}
        <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-xl">
          <div className="flex items-center space-x-2">
            {navLinks.map(({ name, href, id, icon }) => (
              <a
                key={id}
                href={href}
                data-page={name.toLowerCase().replace(" ", "")}
                className="group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                title={name}
              >
                {/* Icon background with glow effect */}
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 group-hover:bg-white/15 rounded-lg border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:shadow-md group-hover:shadow-white/20">
                  {/* Icon */}
                  <div className="text-white text-base sm:text-lg transition-all duration-300 group-hover:scale-105">
                    {icon}
                  </div>

                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Page title - visible on larger screens */}
                <span className="hidden sm:block text-white text-xs font-JetbrainsMono mt-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {name}
                </span>

                {/* Active indicator dot */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            ))}
          </div>
        </div>

        {/* Dock reflection effect */}
        <div className="absolute top-full left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent rounded-b-xl opacity-20 pointer-events-none"></div>
      </div>
    </nav>
  );
};
