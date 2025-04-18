import { cn } from "@/lib/utils"

interface StickyNotePreviewProps {
  position: { x: number; y: number }
  zoom: number
}

export function StickyNotePreview({ position, zoom }: StickyNotePreviewProps) {
  const width = 220
  const height = 220

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
        
        {/* Note preview */}
        <div className="absolute inset-0 bg-[#121212] rounded-lg">
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
        </div>

        {/* Instruction text */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-white/70 text-sm font-medium",
            "bg-black/10 backdrop-blur-[1px] rounded-lg",
            "transition-opacity duration-150"
          )}
        >
          Click to place note
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
  )
} 