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
    { name: "Projects", href: "/projects", id: 3, icon: <TfiFolder /> },
    { name: "Photography", href: "/photography", id: 4, icon: <TfiCamera /> },
    { name: "Creative", href: "/creative", id: 5, icon: <TfiBrushAlt /> },
    { name: "Contact", href: "/contact", id: 6, icon: <TfiEmail /> },
  ];

  const NavLinks = ({ className }: { className: string }) => (
    <div className={className}>
      {navLinks.map(({ name, href, id, icon }) => (
        <a
          key={id}
          href={href}
          className="flex flex-col justify-center items-center text-white font-JetbrainsMono text-sm"
        >
          <div className="pb-1 w-full h-full flex items-center justify-center">
            {icon}
          </div>
          {name}
        </a>
      ))}
    </div>
  );

  return (
    <nav className="w-full flex justify-center">
      <NavLinks className="flex flex-row gap-10 text-md" />
    </nav>
  );
};
