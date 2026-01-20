"use client";

import { useEffect, useState, useMemo } from "react";

export function MatrixBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random vertical lines with varying brightness (dimmer)
  const lines = useMemo(() => {
    const result = [];
    for (let i = 0; i < 80; i++) {
      result.push({
        left: `${i * 1.25}%`,
        opacity: 0.03 + Math.random() * 0.12,
        width: Math.random() > 0.7 ? 2 : 1,
      });
    }
    return result;
  }, []);

  // Generate scattered falling columns (only some columns have the effect)
  const fallingColumns = useMemo(() => {
    const result = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 10,
        duration: 5 + Math.random() * 10,
        opacity: 0.25 + Math.random() * 0.35,
      });
    }
    return result;
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:block hidden">
      {/* Random vertical lines with varying brightness */}
      {lines.map((line, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: line.left,
            width: line.width,
            backgroundColor: `rgba(0, 255, 0, ${line.opacity})`,
          }}
        />
      ))}
      {/* Scattered falling columns */}
      {fallingColumns.map((col, i) => (
        <div
          key={`fall-${i}`}
          className="absolute top-0 w-px animate-matrix-fall"
          style={{
            left: col.left,
            height: '200%',
            backgroundImage: `repeating-linear-gradient(
              180deg,
              rgba(0, 255, 0, ${col.opacity}) 0px,
              transparent 3px,
              transparent 20px
            )`,
            animationDelay: `${col.delay}s`,
            animationDuration: `${col.duration}s`,
          }}
        />
      ))}
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 1px,
            rgba(0, 0, 0, 0.8) 1px,
            rgba(0, 0, 0, 0.8) 2px
          )`,
        }}
      />
      {/* Green glow at top */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(0, 255, 0, 0.1) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
