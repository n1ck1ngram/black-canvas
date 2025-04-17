"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleTextPreviewProps {
  position: { x: number; y: number }; // Screen coordinates
  zoom?: number; // Current zoom level
}

export function SimpleTextPreview({ position, zoom = 1 }: SimpleTextPreviewProps) {
  // Basic dimensions - adjust as needed
  const previewWidth = 100 * zoom;
  const previewHeight = 25 * zoom;

  return (
    <div
      className={cn(
        "absolute border border-dashed border-blue-500 bg-blue-500/10 pointer-events-none",
      )}
      style={{
        left: `${position.x - previewWidth / 2}px`, // Center horizontally on cursor
        top: `${position.y - previewHeight / 2}px`, // Center vertically on cursor
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        zIndex: 100, // Ensure it's above other elements
      }}
    >
      {/* Optional: Add placeholder text indicator */}
      {/* <span className="text-xs text-blue-300 opacity-50">Text</span> */}
    </div>
  );
} 