"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleTextPreviewProps {
  position: { x: number; y: number }; // Screen coordinates
  zoom?: number; // Current zoom level
}

export function SimpleTextPreview({ position, zoom = 1 }: SimpleTextPreviewProps) {
  const width = 150;
  const height = 40;

  return (
    <div
      className={cn(
        "pointer-events-none absolute",
        "transition-transform duration-150 ease-out"
      )}
      style={{
        transform: `translate(${position.x - (width * zoom) / 2}px, ${
          position.y - (height * zoom) / 2
        }px) scale(${zoom})`,
        width,
        height,
      }}
    >
      <div className="relative w-full h-full">
        {/* Selection ring */}
        <div 
          className="absolute inset-0 ring-2 ring-[#4B9FFF] ring-offset-0 rounded-lg opacity-50"
          style={{
            transform: 'scale(1.05)',
          }}
        />
        
        {/* Text preview area */}
        <div className="absolute inset-0 bg-white/5 rounded-lg" />

        {/* Instruction text */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-white/70 text-sm font-medium",
            "bg-black/10 backdrop-blur-[1px] rounded-lg",
            "transition-opacity duration-150"
          )}
        >
          Click to place text
        </div>

        {/* Corner indicators */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#4B9FFF] opacity-50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#4B9FFF] opacity-50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#4B9FFF] opacity-50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#4B9FFF] opacity-50" />
        </div>
      </div>
    </div>
  );
} 