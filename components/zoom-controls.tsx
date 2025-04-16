"use client"

import { Minus, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ZoomControlsProps {
  zoom: number
  setZoom: (zoom: number) => void
  resetView: () => void
}

export function ZoomControls({ zoom, setZoom, resetView }: ZoomControlsProps) {
  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 5))
  }

  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.25))
  }

  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 bg-[#111111] rounded-lg border border-[#333333] p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#222222]"
        onClick={zoomOut}
        title="Zoom Out"
      >
        <Minus size={16} />
      </Button>

      <div className="px-2 text-sm text-gray-300 min-w-[60px] text-center">{Math.round(zoom * 100)}%</div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#222222]"
        onClick={zoomIn}
        title="Zoom In"
      >
        <Plus size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#222222] ml-1"
        onClick={resetView}
        title="Reset View"
      >
        <RotateCcw size={16} />
      </Button>
    </div>
  )
}
