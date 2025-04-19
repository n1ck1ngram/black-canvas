import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { HexColorPicker } from "react-colorful"

interface PenToolProps {
  activeTool: string | null
  onColorSelect: (color: string) => void
  selectedColor: string
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

interface ColorOption {
  name: string
  value: string
  type: 'color' | 'picker'
}

export function PenTool({
  activeTool,
  onColorSelect,
  selectedColor = "#7ab2ff",
  brushSize = 20,
  onBrushSizeChange,
}: PenToolProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false)

  // Update color picker visibility when pen tool is activated/deactivated
  useEffect(() => {
    if (activeTool === "pen") {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
  }, [activeTool])

  // Handle color selection
  const handleColorSelect = (color: string) => {
    if (onColorSelect) {
      onColorSelect(color)
    }
  }

  // Handle custom color picker
  const handleColorPickerClick = () => {
    setShowCustomColorPicker(true)
  }

  const colorOptions = [
    // Top row (10 colors)
    { name: "Orange", value: "#FF6B4B" },
    { name: "Light Orange", value: "#FFA04B" },
    { name: "Yellow", value: "#FFD84B" },
    { name: "Green", value: "#4BFF7B" },
    { name: "Turquoise", value: "#4BFFD8" },
    { name: "Blue", value: "#4B9FFF" },
    { name: "Purple", value: "#9F4BFF" },
    { name: "Pink", value: "#FF4B9F" },
    { name: "White", value: "#FFFFFF" },
    { name: "Gray", value: "#666666" },
    // Bottom row (9 colors + picker)
    { name: "Light Pink", value: "#FFB6B6" },
    { name: "Light Peach", value: "#FFD6B6" },
    { name: "Light Yellow", value: "#FFF6B6" },
    { name: "Light Green", value: "#B6FFB6" },
    { name: "Light Turquoise", value: "#B6FFF6" },
    { name: "Light Blue", value: "#B6D6FF" },
    { name: "Light Purple", value: "#D6B6FF" },
    { name: "Light Pink", value: "#FFB6D6" },
    { name: "Dark Gray", value: "#CCCCCC" },
    { name: "Color Picker", value: "picker" }
  ]

  // Calculate the slider position percentage
  const sliderPosition = ((brushSize - 5) / 45) * 100

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="relative">
        {/* Color picker that appears above the toolbar when pen tool is active */}
        {showColorPicker && (
          <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-[#2a2a2a] rounded-lg border border-[#333333] shadow-lg p-3 transition-all duration-200 ease-in-out">
            {/* Brush size control */}
            <div className="flex flex-col items-center mr-2">
              <div className="text-sm text-gray-300 mb-3">Size: {brushSize}px</div>
              <div className="w-24 flex items-center justify-center">
                <div className="relative w-full h-8 flex items-center">
                  {/* Track background */}
                  <div className="absolute h-1 w-full bg-[#555555] rounded-full"></div>

                  {/* Active track */}
                  <div 
                    className="absolute h-1 bg-[#7ab2ff] rounded-full" 
                    style={{ width: `${sliderPosition}%` }}
                  ></div>

                  {/* Thumb */}
                  <div
                    className="absolute h-4 w-4 bg-white rounded-full shadow-md transform -translate-x-1/2"
                    style={{ left: `${sliderPosition}%` }}
                  ></div>

                  {/* Hidden input for interaction */}
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange?.(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-[#444444]"></div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              {/* Top row */}
              <div className="flex items-center gap-2">
                {colorOptions.slice(0, 10).map((color) => (
                  <button
                    key={color.value}
                    onClick={() => color.value === "picker" ? handleColorPickerClick() : handleColorSelect(color.value)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-150 relative",
                      selectedColor === color.value && "ring-2 ring-offset-2 ring-offset-[#2a2a2a]"
                    )}
                    style={{
                      backgroundColor: color.value,
                      ...(selectedColor === color.value && { '--tw-ring-color': color.value } as any)
                    }}
                    title={color.name}
                  />
                ))}
              </div>
              
              {/* Bottom row */}
              <div className="flex items-center gap-2">
                {colorOptions.slice(10).map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-150 relative",
                      selectedColor === color.value && "ring-2 ring-offset-2 ring-offset-[#2a2a2a]",
                      color.value === "picker" && "bg-gradient-to-r from-[#FF0000] via-[#00FF00] to-[#0000FF]"
                    )}
                    style={{
                      backgroundColor: color.value !== "picker" ? color.value : undefined,
                      ...(selectedColor === color.value && { '--tw-ring-color': color.value } as any)
                    }}
                    onClick={() => {
                      if (color.value === "picker") {
                        handleColorPickerClick()
                      } else {
                        handleColorSelect(color.value)
                      }
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom color picker */}
        {showCustomColorPicker && (
          <div className="absolute bottom-full mb-2 p-2 bg-white rounded-lg shadow-lg">
            <HexColorPicker
              color={selectedColor}
              onChange={(color) => {
                onColorSelect?.(color)
                setShowCustomColorPicker(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 