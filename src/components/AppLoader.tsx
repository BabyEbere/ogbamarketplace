'use client';

import React from 'react';
import Image from 'next/image';

interface AppLoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AppLoader({
  fullScreen = false,
  message = 'Loading Ogba Market Place...',
  size = 'md',
}: AppLoaderProps) {
  const sizeMap = {
    sm: { width: 140, height: 46 },
    md: { width: 220, height: 74 },
    lg: { width: 280, height: 94 },
  };

  const { width, height } = sizeMap[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      {/* Animated Logo Container */}
      <div className="relative flex items-center justify-center mb-3">
        {/* Ambient Pulsing Glow Backdrop */}
        <div className="absolute inset-0 w-full h-full bg-[#1E5E3A]/15 rounded-full blur-xl animate-pulse" />
        
        {/* Animated Brand Logo */}
        <div className="relative z-10 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#D0EBD8] shadow-lg shadow-emerald-950/5">
          <Image
            src="/images/logo-loader.svg"
            alt="Loading Ogba Market Place"
            width={width}
            height={height}
            priority
            unoptimized
            style={{ width: 'auto', height: size === 'sm' ? 38 : size === 'lg' ? 68 : 52, objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Message & Status Indicator */}
      {message && (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#1E5E3A] animate-ping" />
          <p className="text-xs sm:text-sm font-bold text-[#123E25] tracking-tight">
            {message}
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7FAF8]/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
