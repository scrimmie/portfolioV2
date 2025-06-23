import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LogoProps {
  logoSrc: string;
  alt: string;
}

export default function Logo({ logoSrc, alt }: LogoProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Holographic background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-lg"
        animate={{
          background: [
            "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)",
            "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)",
            "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Scanning lines contained to logo area only */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.3) 2%, transparent 4%)",
            "linear-gradient(90deg, transparent 96%, rgba(0, 255, 255, 0.3) 98%, transparent 100%)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Glowing border */}
      <motion.div
        className="absolute inset-0 border-2 border-cyan-400/30 rounded-lg"
        animate={{
          borderColor: [
            "rgba(6, 182, 212, 0.3)",
            "rgba(168, 85, 247, 0.3)",
            "rgba(236, 72, 153, 0.3)",
            "rgba(6, 182, 212, 0.3)",
          ],
          boxShadow: [
            "0 0 20px rgba(6, 182, 212, 0.2)",
            "0 0 30px rgba(168, 85, 247, 0.2)",
            "0 0 25px rgba(236, 72, 153, 0.2)",
            "0 0 20px rgba(6, 182, 212, 0.2)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Logo image */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <motion.img
          src={logoSrc}
          alt={alt}
          className="max-w-full max-h-full object-contain filter brightness-110 contrast-110"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400/50"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400/50"></div>
    </div>
  );
}
