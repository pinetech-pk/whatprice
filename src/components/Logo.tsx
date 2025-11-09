import React from "react";

export type LogoSize = "small" | "standard" | "large";

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeConfig = {
  small: {
    containerClass: "h-8 w-auto",
    textClass: "text-xl",
  },
  standard: {
    containerClass: "h-10 w-auto",
    textClass: "text-3xl",
  },
  large: {
    containerClass: "h-16 w-auto",
    textClass: "text-5xl",
  },
};

export const Logo: React.FC<LogoProps> = ({ size = "standard", className = "" }) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.containerClass} ${className}`}>
      <svg
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        aria-label="WhatPrice Logo"
      >
        {/* Price Tag Icon */}
        <path
          d="M8 12L4 16V28C4 29.1 4.9 30 6 30H18C19.1 30 20 29.1 20 28V16L16 12H8Z"
          fill="url(#gradient1)"
        />
        <circle cx="12" cy="22" r="2" fill="white" />
        <path
          d="M12 8L14 12H10L12 8Z"
          fill="url(#gradient2)"
        />

        {/* Text: WhatPrice */}
        <text
          x="28"
          y="26"
          className="font-bold"
          fill="url(#textGradient)"
          style={{ fontSize: "18px", fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          WhatPrice
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="4" y1="12" x2="20" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="gradient2" x1="10" y1="8" x2="14" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="textGradient" x1="28" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;
