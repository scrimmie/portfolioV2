import { useEffect, useState } from "react";

const ROLES = [
  "Tech Lead",
  "Software Engineer",
  "AI Tinkerer",
  "DJ",
  "Photographer",
  "Music Nerd",
];

// Cycles through David's roles with a fade/scale swap. A React island (rather
// than a page <script>) so it hydrates reliably across View Transitions.
export const RoleCycler = ({ className = "" }: { className?: string }) => {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    let interval: number | undefined;
    let fade: number | undefined;

    const swap = () => {
      setShown(false); // fade/scale out
      fade = window.setTimeout(() => {
        setIndex((i) => (i + 1) % ROLES.length);
        setShown(true); // fade/scale the next one in
      }, 300);
    };

    // Start after 2s, then rotate every 3s.
    const start = window.setTimeout(() => {
      swap();
      interval = window.setInterval(swap, 3000);
    }, 2000);

    return () => {
      clearTimeout(start);
      if (fade) clearTimeout(fade);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <p
      className={className}
      style={{
        transition: "all 0.5s ease",
        opacity: shown ? 1 : 0,
        transform: shown ? "scale(1)" : "scale(0.8)",
      }}
    >
      {ROLES[index]}
    </p>
  );
};

export default RoleCycler;
