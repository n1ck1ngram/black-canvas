"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"

interface BrushSizeControlProps {
  isVisible: boolean
  initialSize?: number
  onSizeChange: (size: number) => void
  onClear?: () => void
}

export function BrushSizeControl({ isVisible, initialSize = 20, onSizeChange, onClear }: BrushSizeControlProps) {
  const [size, setSize] = useState(initialSize)

  // Update size when initialSize changes
  useEffect(() => {
    setSize(initialSize)
  }, [initialSize])

  const handleSizeChange = (value: number[]) => {
    const newSize = value[0]
    setSize(newSize)
    onSizeChange(newSize)
  }

  return (
    <div
      className={`fixed bottom-6 left-6 bg-[#111111] p-4 rounded-lg border border-[#333333] shadow-xl z-[9999] transition-all duration-200 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ width: "220px" }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Brush Size</h3>
        <span className="text-sm text-gray-400 bg-[#222222] px-2 py-1 rounded">{size}px</span>
      </div>

      <Slider defaultValue={[size]} min={1} max={50} step={1} onValueChange={handleSizeChange} className="mb-4" />

      {onClear && (
        <button
          onClick={onClear}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Clear Canvas
        </button>
      )}
    </div>
  )
}
