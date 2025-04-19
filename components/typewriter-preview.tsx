import { cn } from "@/lib/utils"

interface TypewriterPreviewProps {
  content: string
  position: { x: number; y: number }
  fontSize: number
  color: string
  zoom: number
}

export function TypewriterPreview({
  content,
  position,
  fontSize,
  color,
  zoom,
}: TypewriterPreviewProps) {
  // Calculate dimensions
  const width = 400
  const height = 300

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div
        className="w-full h-full bg-white/80 shadow-lg p-6 border border-[#d4d4d4]"
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: `${fontSize}px`,
          color: color,
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          borderRadius: '2px',
          boxShadow: '3px 3px 10px rgba(0,0,0,0.2)',
          minHeight: '280px'
        }}
      >
        {content || "Click to start typing..."}
      </div>
    </div>
  )
} 