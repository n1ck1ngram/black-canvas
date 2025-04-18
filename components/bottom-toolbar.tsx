"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { HexColorPicker } from "react-colorful"

type Tool = "pointer" | "move" | "pen" | "sticky" | "text" | "spray" | "shapes" | "tape" | "typewriter" | null

interface BottomToolbarProps {
  activeTool: string | null
  onToolSelect: (tool: string | null) => void
  onColorSelect?: (color: string) => void
  selectedColor?: string
  brushSize?: number
  onBrushSizeChange?: (size: number) => void
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

  // Update color picker visibility when spray tool is activated/deactivated
  useEffect(() => {
    if (activeTool === "spray") {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
  }, [activeTool])

  // Update the handleToolClick function to ensure it properly toggles tools
  const handleToolClick = (tool: Tool) => {
    // Pass the tool to the parent component
    onToolSelect(tool)
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

  // Calculate the slider position percentage
  const sliderPosition = ((brushSize - 5) / 45) * 100

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 bottom-toolbar-container">
      <div className="relative">
        {/* Color picker that appears above the toolbar when spray tool is active */}
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
                  <div className="absolute h-1 bg-[#7ab2ff] rounded-full" style={{ width: `${sliderPosition}%` }}></div>

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
        <div className="flex items-center justify-center">
          {/* Pointer Tool - Now separate */}
          <ToolCell
            isActive={activeTool === "pointer" || activeTool === null}
            onClick={() => handleToolClick("pointer")}
            onMouseEnter={() => setHoveredTool("pointer")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "pointer"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/mouse-pointer-new.png"
                alt="Select Tool"
                width={48}
                height={48}
                className={cn(
                  "object-contain transition-all",
                  (activeTool === "pointer" || activeTool === null) ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
                )}
                priority
              />
            </div>
          </ToolCell>

          {/* Move Tool - Now separate */}
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
                alt="Move Tool"
                width={52}
                height={52}
                className={cn(
                  "object-contain transition-all filter",
                  activeTool === "move" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
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

          {/* Pen Tool - Added */}
          <ToolCell
            isActive={activeTool === "pen"}
            onClick={() => handleToolClick("pen")}
            onMouseEnter={() => setHoveredTool("pen")}
            onMouseLeave={() => setHoveredTool(null)}
            isHovered={hoveredTool === "pen"}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/images/Pen-Tool.png"
                alt="Pen Tool"
                width={64}
                height={64}
                className={cn(
                  "object-contain transition-all filter",
                  activeTool === "pen" ? "brightness-[1.6] contrast-[1.25]" : "brightness-[0.75] contrast-[1.15]",
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
