"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface TypewriterToolProps {
  id: string
  content: string
  position: { x: number; y: number }
  fontSize: number
  color: string
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: { x: number; y: number }) => void
  zoom?: number
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number }
}

export function TypewriterTool({
  id,
  content,
  position,
  fontSize,
  color,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  zoom = 1,
  screenToCanvas = (x, y) => ({ x, y }),
}: TypewriterToolProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus the textarea when editing mode is activated
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Handle click on the text
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // If already selected, enter edit mode
    if (isSelected && !isEditing) {
      setIsEditing(true)
      return
    }

    // First click selects the text
    if (!isSelected) {
      onSelect()
    }
  }

  // Handle textarea click
  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isEditing && isSelected) {
      setIsEditing(true)
    } else if (!isSelected) {
      onSelect()
    }
  }

  // Start dragging
  const handleStartDrag = (e: React.MouseEvent) => {
    if (!textRef.current) return

    // Don't start drag if in editing mode and clicking on the textarea
    if (isEditing && e.target instanceof HTMLTextAreaElement) return

    e.stopPropagation()
    onSelect()
    setIsDragging(true)

    // Calculate drag offset in canvas coordinates
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    setDragOffset({
      x: canvasCoords.x - position.x,
      y: canvasCoords.y - position.y,
    })
  }

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      // Calculate new position in canvas coordinates
      const canvasCoords = screenToCanvas(e.clientX, e.clientY)
      const newPosition = {
        x: canvasCoords.x - dragOffset.x,
        y: canvasCoords.y - dragOffset.y,
      }

      // Update position
      onPositionChange(newPosition)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, onPositionChange, screenToCanvas])

  // Handle click outside to exit editing mode
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && textRef.current && !textRef.current.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditing])

  return (
    <div
      ref={textRef}
      className={cn("absolute", isDragging ? "cursor-grabbing" : isEditing ? "cursor-text" : "cursor-grab")}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
        transform: `rotate(0deg)`,
        transformOrigin: "center center",
        transition: isDragging ? "none" : "transform 0.3s, box-shadow 0.3s",
      }}
      onClick={handleClick}
      onMouseDownCapture={handleStartDrag}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          className="bg-transparent p-2 resize-none border-none focus:outline-none min-w-[200px] min-h-[40px]"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Type something..."
          onClick={handleTextareaClick}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            border: isSelected ? "1px dashed rgba(124, 58, 237, 0.8)" : "none",
            background: isSelected ? "rgba(124, 58, 237, 0.1)" : "transparent",
            fontFamily: "monospace",
            lineHeight: "1.2",
            width: "auto",
            height: "auto",
          }}
        />
      ) : (
        <div
          className={cn(
            "p-2 whitespace-pre-wrap break-words",
            isSelected && "border border-dashed border-[#7c3aed] bg-[#7c3aed]/10",
          )}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            fontFamily: "monospace",
            lineHeight: "1.2",
            minWidth: "20px",
            minHeight: "20px",
          }}
        >
          {content || <span className="opacity-50">Click to edit text...</span>}
        </div>
      )}
    </div>
  )
}
