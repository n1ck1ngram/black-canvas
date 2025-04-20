"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"

type Tool = "pointer" | "move" | "pen" | "sticky" | "text" | "spray" | "shapes" | "tape" | "typewriter" | null

interface BottomToolbarProps {
  activeTool: string | null
  onToolSelect: (tool: string | null) => void
  onColorSelect?: (color: string) => void
  selectedColor?: string
  brushSize?: number
  onBrushSizeChange?: (size: number) => void
  penTip?: 'round' | 'rectangle'
  onPenTipChange?: (tip: 'round' | 'rectangle') => void
  opacity?: number
  onOpacityChange?: (opacity: number) => void
}

interface ColorOption {
  name: string;
  value: string;
  type: 'color' | 'picker';
}

export function BottomToolbar({
  activeTool,
  onToolSelect,
  onColorSelect,
  selectedColor = "#7ab2ff",
  brushSize = 20,
  onBrushSizeChange,
  penTip = 'round',
  onPenTipChange,
  opacity = 1,
  onOpacityChange,
}: BottomToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<Tool>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false)

  // Ensure the toolbar doesn't interfere with cursor tracking
  useEffect(() => {
    if (activeTool === "spray") {
      const toolbarElement = document.querySelector(".bottom-toolbar-container")
      if (toolbarElement) {
        toolbarElement.classList.add("pointer-events-auto")
        toolbarElement.classList.remove("pointer-events-none")
      }
    }
  }, [activeTool])

  // Update color picker visibility when spray or pen tool is activated/deactivated
  useEffect(() => {
    if (activeTool === "spray" || activeTool === "pen") {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
  }, [activeTool])

  // Update the handleToolClick function to ensure it properly toggles tools
  const handleToolClick = (tool: Tool) => {
    if (tool === activeTool) {
      // If clicking the same tool, deactivate it
      onToolSelect(null)
      setShowColorPicker(false)
    } else {
      // Pass the tool to the parent component
      onToolSelect(tool)
    }
  }

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

  // Calculate the slider position percentage based on the active tool
  const sliderPosition = (() => {
    if (activeTool === 'pen') {
      // For pen tool: 5-50px range
      return ((brushSize - 5) / 45) * 100
    } else {
      // For spray tool: 5-50px range
      return ((brushSize - 5) / 45) * 100
    }
  })()

  // Calculate opacity slider position (0-100%)
  const opacityPosition = Math.round(opacity * 100)

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 bottom-toolbar-container">
      <div className="relative">
        {/* Color picker that appears above the toolbar when spray tool is active */}
        {showColorPicker && (
          <div className="absolute bottom-[120px] left-1/2 transform -translate-x-1/2 flex items-start gap-3 bg-[#2a2a2a] rounded-lg border border-[#333333] shadow-lg p-3 transition-all duration-200 ease-in-out">
            {/* Brush size control */}
            <div className="flex flex-col items-start z-20">
              <div className="text-sm text-gray-300 mb-2">Size: {brushSize}px</div>
              <div className="w-32 flex items-center justify-center">
                <div className="relative w-full h-8 flex items-center">
                  {/* Track background */}
                  <div className="absolute h-1 w-full bg-[#555555] rounded-full"></div>

                  {/* Active track */}
                  <div 
                    className="absolute h-1 bg-[#7ab2ff] rounded-full" 
                    style={{ 
                      width: `${sliderPosition}%`,
                      transition: 'width 0.1s ease-out'
                    }}
                  ></div>

                  {/* Thumb */}
                  <div
                    className="absolute h-4 w-4 bg-white rounded-full shadow-md transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                    style={{ 
                      left: `${sliderPosition}%`,
                      transition: 'left 0.1s ease-out'
                    }}
                  ></div>

                  {/* Hidden input for interaction */}
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange?.(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    style={{ height: '32px' }}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-[#444444] z-10"></div>

            {/* Opacity control - Only show for pen tool */}
            {activeTool === 'pen' && (
              <>
                <div className="flex flex-col items-start z-20">
                  <div className="text-sm text-gray-300 mb-2">Opacity: {opacityPosition}%</div>
                  <div className="w-32 flex items-center justify-center">
                    <div className="relative w-full h-8 flex items-center">
                      {/* Track background */}
                      <div className="absolute h-1 w-full bg-[#555555] rounded-full"></div>

                      {/* Active track */}
                      <div 
                        className="absolute h-1 bg-[#7ab2ff] rounded-full" 
                        style={{ 
                          width: `${opacityPosition}%`,
                          transition: 'width 0.1s ease-out'
                        }}
                      ></div>

                      {/* Thumb */}
                      <div
                        className="absolute h-4 w-4 bg-white rounded-full shadow-md transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                        style={{ 
                          left: `${opacityPosition}%`,
                          transition: 'left 0.1s ease-out'
                        }}
                      ></div>

                      {/* Hidden input for interaction */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacityPosition}
                        onChange={(e) => {
                          const newOpacity = Number(e.target.value) / 100
                          onOpacityChange?.(newOpacity)
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        style={{ height: '32px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Divider after opacity slider */}
                <div className="h-16 w-px bg-[#444444] z-10"></div>
              </>
            )}

            {/* Color picker */}
            <div className="flex flex-col gap-2 z-10">
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

            {/* Pen tip options - only show for pen tool */}
            {activeTool === 'pen' && (
              <>
                <div className="h-16 w-px bg-[#444444] z-10"></div>
                <div className="flex flex-col gap-2 z-10">
                  <div className="text-sm text-gray-300 mb-1">Pen Tips:</div>
                  <div className="flex items-center gap-2">
                    {/* Round Tip Button */}
                    <button
                      onClick={() => onPenTipChange?.('round')}
                      className={cn(
                        "w-8 h-8 rounded transition-all duration-150 flex items-center justify-center text-white",
                        penTip === 'round' ? "bg-[#444444]" : "bg-[#333333] hover:bg-[#3a3a3a]",
                        penTip === 'round' ? "text-white" : "text-gray-400"
                      )}
                      title="Round Tip"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                    {/* Rectangle Tip Button */}
                    <button
                      onClick={() => onPenTipChange?.('rectangle')}
                      className={cn(
                        "w-8 h-8 rounded transition-all duration-150 flex items-center justify-center text-white",
                        penTip === 'rectangle' ? "bg-[#444444]" : "bg-[#333333] hover:bg-[#3a3a3a]",
                        penTip === 'rectangle' ? "text-white" : "text-gray-400"
                      )}
                      title="Rectangle Tip"
                    >
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2"/>
                       </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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

        {/* Toolbar container */}
        <div className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg border border-white/10">
          {/* Pointer tool */}
          <ToolCell
            isActive={activeTool === "pointer"}
            onClick={() => handleToolClick("pointer")}
            onMouseEnter={() => setHoveredTool("pointer")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "pointer"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/mouse-pointer-new.png"
                alt="Pointer tool"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "pointer" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Hand tool */}
          <ToolCell
            isActive={activeTool === "move"}
            onClick={() => handleToolClick("move")}
            onMouseEnter={() => setHoveredTool("move")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "move"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/move-tool.png"
                alt="Hand tool"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "move" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Pen tool */}
          <ToolCell
            isActive={activeTool === "pen"}
            onClick={() => handleToolClick("pen")}
            onMouseEnter={() => setHoveredTool("pen")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "pen"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/pen-tool.png"
                alt="Pen tool"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "pen" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Sticky Notes Tool */}
          <ToolCell
            isActive={activeTool === "sticky"}
            onClick={() => handleToolClick("sticky")}
            onMouseEnter={() => setHoveredTool("sticky")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "sticky"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/sticky-notes.png"
                alt="Sticky Notes"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "sticky" ? "brightness-[2.0] contrast-[1.1]" : "brightness-[1.25] contrast-[1.05]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Text Tool (T icon) */}
          <ToolCell
            isActive={activeTool === "text"}
            onClick={() => handleToolClick("text")}
            onMouseEnter={() => setHoveredTool("text")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "text"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/type-icon.png"
                alt="Text Tool"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all filter",
                  activeTool === "text" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Spray Paint Tool */}
          <ToolCell
            isActive={activeTool === "spray"}
            onClick={() => handleToolClick("spray")}
            onMouseEnter={() => setHoveredTool("spray")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "spray"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/spray-paint.png"
                alt="Spray Paint"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "spray" ? "brightness-[2.0] contrast-[1.1]" : "brightness-[1.25] contrast-[1.05]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Shapes Tool */}
          <ToolCell
            isActive={activeTool === "shapes"}
            onClick={() => handleToolClick("shapes")}
            onMouseEnter={() => setHoveredTool("shapes")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "shapes"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/shapes-icon.png"
                alt="Shapes"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all filter",
                  activeTool === "shapes" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Tape Tool */}
          <ToolCell
            isActive={activeTool === "tape"}
            onClick={() => handleToolClick("tape")}
            onMouseEnter={() => setHoveredTool("tape")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "tape"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/tape-icon.png"
                alt="Tape"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "tape" ? "brightness-[2.0] contrast-[1.1]" : "brightness-[1.25] contrast-[1.05]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Typewriter Tool - Now using the new grey typewriter icon */}
          <ToolCell
            isActive={activeTool === "typewriter"}
            onClick={() => handleToolClick("typewriter")}
            onMouseEnter={() => setHoveredTool("typewriter")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "typewriter"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/grey-typewriter.png"
                alt="Typewriter"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all",
                  activeTool === "typewriter" ? "brightness-[1.8] contrast-[1.2]" : "brightness-[1.0] contrast-[1.1]",
                )}
                priority
              />
            </div>
          </ToolCell>
        </div>
      </div>
    </div>
  )
}

interface ToolCellProps {
  children: React.ReactNode
  isActive: boolean
  isHovered: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

// Update the ToolCell component to make it slightly larger to accommodate the bigger icons
function ToolCell({ children, isActive, isHovered, onClick, onMouseEnter, onMouseLeave }: ToolCellProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex items-center justify-center h-[90px] w-[90px] bg-[#2a2a2a] border border-[#333333] m-0",
        isActive ? "bg-[#333333]" : isHovered ? "bg-[#303030]" : "",
      )}
    >
      {children}
    </div>
  )
}
