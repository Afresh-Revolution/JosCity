import React, { useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import "../scss/_darkmode-toggle.scss";

const DarkModeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const didDragRef = useRef(false);

  // Load saved position from localStorage on mount
  useEffect(() => {
    const getInitialPosition = () => {
      const savedPosition = localStorage.getItem("darkModeTogglePosition");
      if (savedPosition) {
        try {
          const { x: savedX, y: savedY } = JSON.parse(savedPosition);
          return { x: savedX, y: savedY };
        } catch (e) {
          // If parsing fails, use default position
          return {
            x: window.innerWidth - 70,
            y: window.innerHeight / 2 - 25,
          };
        }
      } else {
        // Default position: right side, vertically centered
        return {
          x: window.innerWidth - 70,
          y: window.innerHeight / 2 - 25,
        };
      }
    };

    const initialPos = getInitialPosition();
    x.set(initialPos.x);
    y.set(initialPos.y);
  }, [x, y]);

  // Update constraints when window resizes
  useEffect(() => {
    const handleResize = () => {
      const currentX = x.get();
      const currentY = y.get();
      // Ensure position is within bounds
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      x.set(Math.min(Math.max(0, currentX), maxX));
      y.set(Math.min(Math.max(0, currentY), maxY));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [x, y]);

  // Save position to localStorage when drag ends; mark that we dragged so click doesn't toggle theme
  const handleDragStart = () => {
    didDragRef.current = true;
  };

  const handleDragEnd = () => {
    const currentX = x.get();
    const currentY = y.get();
    localStorage.setItem(
      "darkModeTogglePosition",
      JSON.stringify({ x: currentX, y: currentY })
    );
    // Reset after a tick so click handler can see we dragged (don't toggle theme on release)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        didDragRef.current = false;
      });
    });
  };

  const handleClick = () => {
    if (didDragRef.current) return;
    toggleTheme();
  };

  return (
    <motion.button
      className="dark-mode-toggle"
      onClick={handleClick}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      drag
      dragMomentum={false}
      dragConstraints={{
        left: 0,
        right: typeof window !== "undefined" ? window.innerWidth - 50 : 0,
        top: 0,
        bottom: typeof window !== "undefined" ? window.innerHeight - 50 : 0,
      }}
      dragElastic={0.1}
      style={{ x, y, left: 0, top: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {theme === "light" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )}
    </motion.button>
  );
};

export default DarkModeToggle;
