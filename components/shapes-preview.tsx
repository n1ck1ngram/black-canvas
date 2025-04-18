import { ShapeType } from "./shapes-tool"
import { cn } from "@/lib/utils"

interface ShapesPreviewProps {
  position: { x: number; y: number }
  zoom: number
  shapeType: ShapeType
  color: string
}

export function ShapesPreview({ position, zoom, shapeType, color }: ShapesPreviewProps) {
  const width = 150
  const height = 150

  const renderPreviewShape = () => {
    switch (shapeType) {
      case "rectangle":
        return (
          <rect 
            width={width} 
            height={height} 
            fill={color} 
            rx="4" 
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "circle":
        return (
          <circle 
            cx={width/2} 
            cy={height/2} 
            r={Math.min(width, height)/2} 
            fill={color} 
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "diamond":
        return (
          <polygon
            points={`${width/2},0 ${width},${height/2} ${width/2},${height} 0,${height/2}`}
            fill={color}
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "triangle":
        return (
          <polygon
            points={`${width/2},0 ${width},${height} 0,${height}`}
            fill={color}
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "invertedTriangle":
        return (
          <polygon
            points={`0,0 ${width},0 ${width/2},${height}`}
            fill={color}
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "parallelogram":
        return (
          <polygon
            points={`20,0 ${width},0 ${width-20},${height} 0,${height}`}
            fill={color}
            opacity={0.6}
            className="drop-shadow-lg"
          />
        )
      case "arrow":
        return (
          <path
            d={`M0,${height/2} H${width-20} L${width-10},${height/4} L${width},${height/2} L${width-10},${height*3/4} L${width-20},${height/2}`}
            fill={color}
            opacity={0.6}
            strokeLinejoin="round"
            className="drop-shadow-lg"
          />
        )
      default:
        return null
    }
  }

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
        
        {/* Shape */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute top-0 left-0"
        >
          {renderPreviewShape()}
        </svg>

        {/* Instruction text */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-white/70 text-sm font-medium",
            "bg-black/10 backdrop-blur-[1px] rounded-lg",
            "transition-opacity duration-150"
          )}
        >
          Click to place
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