import type React from "react"

interface StickyNotePreviewProps {
  position: { x: number; y: number }
  zoom: number
}

export function StickyNotePreview({ position, zoom }: StickyNotePreviewProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "220px",
        height: "220px",
        opacity: 0.7,
        transform: `translate(-50%, -50%)`,
        zIndex: 100,
      }}
    >
      <div
        className="w-full h-full transition-all duration-200"
        style={{
          backgroundColor: "#121212",
          borderRadius: "2px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 4px 10px rgba(0,0,0,0.5)",
        }}
      >
        {/* Edge highlight - subtle light reflection on top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
          }}
        />

        {/* Left edge highlight */}
        <div
          className="absolute top-0 left-0 bottom-0 w-[1px] opacity-10"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
          }}
        />

        {/* Corner shadows for subtle curling effect */}
        <div
          className="absolute top-0 left-0 w-[40px] h-[40px] opacity-30"
          style={{
            background: "radial-gradient(circle at 0 0, rgba(0,0,0,0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[60px] h-[60px] opacity-30"
          style={{
            background: "radial-gradient(circle at 100% 0, rgba(0,0,0,0.5) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[80px] h-[80px] opacity-40"
          style={{
            background: "radial-gradient(circle at 100% 100%, rgba(0,0,0,0.6) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[50px] h-[50px] opacity-30"
          style={{
            background: "radial-gradient(circle at 0 100%, rgba(0,0,0,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Interior gradient for depth */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
          }}
        />

        {/* Preview text */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 opacity-50 pointer-events-none">
          Click to place note
        </div>
      </div>
    </div>
  )
} 