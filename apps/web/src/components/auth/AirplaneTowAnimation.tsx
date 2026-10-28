'use client';

import React from 'react';

interface AirplaneTowAnimationProps {
  isLanded: boolean;
}

export const AirplaneTowAnimation: React.FC<AirplaneTowAnimationProps> = ({ isLanded }) => {
  if (isLanded) return null;

  return (
    <>
      {/* 1. The Airplane & Towing Cables */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full pointer-events-none z-20">
        {/* The Plane */}
        <div className="relative animate-plane-flyoff flex justify-center">
          <svg
            viewBox="0 0 320 110"
            className="w-72 sm:w-80 h-auto filter drop-shadow-xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dual Jet Exhaust Glow & Contrail */}
            <g className="animate-jet-boost">
              {/* Outer Contrail Trail */}
              <path
                d="M 20 62 L -80 62"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
              <path
                d="M 35 68 L -70 68"
                stroke="rgba(56,189,248,0.6)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Jet Flame Core */}
              <ellipse cx="48" cy="64" rx="14" ry="5" fill="#f59e0b" className="animate-jet-pulse" />
              <ellipse cx="50" cy="64" rx="8" ry="3" fill="#38bdf8" />
              <ellipse cx="52" cy="64" rx="4" ry="1.5" fill="#ffffff" />
            </g>

            {/* Main Fuselage Body */}
            <path
              d="M 60 62 C 90 62 140 60 210 58 C 250 56 280 50 300 46 C 308 44 312 40 305 38 C 290 34 260 30 220 30 C 140 30 90 32 60 38 Z"
              fill="#ffffff"
            />

            {/* VietSky Signature Deep Navy Underside */}
            <path
              d="M 60 62 C 100 62 160 60 220 56 C 265 52 295 47 305 38 C 295 44 260 50 215 54 C 140 58 90 60 60 62 Z"
              fill="#0f2b5c"
            />

            {/* Golden Lotus Ribbon / Speedline */}
            <path
              d="M 68 56 C 120 54 180 52 240 48 C 275 44 295 41 300 39"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Cockpit Visor / Glass */}
            <path
              d="M 285 37 C 295 38 300 40 298 42 C 290 42 280 40 282 38 Z"
              fill="#0369a1"
            />
            <path
              d="M 286 38 L 295 40"
              stroke="#7dd3fc"
              strokeWidth="1"
            />

            {/* Cabin Passenger Windows */}
            <g fill="#0f2b5c" opacity="0.8">
              {[120, 134, 148, 162, 176, 190, 204, 218, 232, 246, 260].map((x) => (
                <rect key={x} x={x} y="39" width="5.5" height="4" rx="2" />
              ))}
            </g>

            {/* Vertical Stabilizer / Tail Fin */}
            <path
              d="M 70 36 L 38 4 C 36 2 34 2 32 5 L 42 38 Z"
              fill="#0f2b5c"
            />
            {/* VietSky Golden Emblem on Tail */}
            <path
              d="M 45 15 L 49 24 L 41 24 Z"
              fill="#fbbf24"
            />
            <circle cx="45" cy="20" r="2.5" fill="#f59e0b" />

            {/* Wings (Swept with gold winglet) */}
            <path
              d="M 175 48 L 135 84 C 133 86 135 88 138 88 L 160 84 L 205 50 Z"
              fill="#e2e8f0"
            />
            <path
              d="M 134 85 L 132 94 C 132 96 134 97 136 96 L 140 88 Z"
              fill="#fbbf24"
            />

            {/* Jet Engine Turbofan */}
            <rect x="155" y="58" width="36" height="14" rx="6" fill="#475569" />
            <ellipse cx="190" cy="65" rx="3.5" ry="6.5" fill="#0f2b5c" stroke="#fbbf24" strokeWidth="1" />
            <ellipse cx="156" cy="65" rx="3" ry="5.5" fill="#0284c7" />

            {/* Tow Hook / Winch bracket at rear */}
            <circle cx="70" cy="58" r="4" fill="#334155" stroke="#fbbf24" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Towing Cables (Connecting Plane Hook to Login Box) */}
        <svg
          className="absolute top-16 left-0 w-full h-24 overflow-visible animate-tow-cables pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Cable */}
          <line
            x1="45%"
            y1="10"
            x2="15%"
            y2="95"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          {/* Right Cable */}
          <line
            x1="45%"
            y1="10"
            x2="85%"
            y2="95"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          {/* Left Carabiner Ring on Box */}
          <circle cx="15%" cy="95" r="4.5" fill="#0f2b5c" stroke="#fbbf24" strokeWidth="2" />
          {/* Right Carabiner Ring on Box */}
          <circle cx="85%" cy="95" r="4.5" fill="#0f2b5c" stroke="#fbbf24" strokeWidth="2" />
        </svg>
      </div>

      {/* 2. Touchdown Shockwave / Cushion */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-gradient-to-r from-primary-500/20 via-gold-400/40 to-primary-500/20 rounded-full blur-xl pointer-events-none animate-touchdown-dust" />
    </>
  );
};

