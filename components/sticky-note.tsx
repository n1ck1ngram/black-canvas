"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface StickyNoteProps {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: { x: number; y: number }) => void
  zoom?: number
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number }
}

export function StickyNote({
  id,
  content,
  position,
  color,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  zoom = 1,
  screenToCanvas = (x, y) => ({ x, y }),
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus the textarea when editing mode is activated
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Modify the handleMouseDown function to ensure it properly stops propagation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!noteRef.current) return

    // Always stop propagation to prevent canvas click when clicking on a note
    e.stopPropagation()

    // If already selected, enter edit mode
    if (isSelected && !isEditing) {
      setIsEditing(true)
      return
    }

    // First click selects the note
    if (!isSelected) {
      onSelect()
      return
    }
  }

  // Also ensure the handleTextareaClick stops propagation
  const handleTextareaClick = (e: React.MouseEvent) => {
    // Always stop propagation
    e.stopPropagation()

    if (!isEditing && isSelected) {
      setIsEditing(true)
    } else if (!isSelected) {
      onSelect()
    }
  }

  // Make sure the drag handler also stops propagation
  const handleStartDrag = (e: React.MouseEvent) => {
    if (!noteRef.current) return

    // Don't start drag if in editing mode and clicking on the textarea
    if (isEditing && e.target instanceof HTMLTextAreaElement) return

    // Always stop propagation
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
      if (isEditing && noteRef.current && !noteRef.current.contains(e.target as Node)) {
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

  // Calculate a slight random rotation for a more natural look
  const rotation = useRef(Math.random() * 2 - 1) // Between -1 and 1 degrees

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute w-[220px] h-[220px]",
        isDragging ? "cursor-grabbing" : isEditing ? "cursor-text" : "cursor-grab",
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
        transform: `rotate(${rotation.current}deg)`,
        transformOrigin: "center center",
        transition: isDragging ? "none" : "transform 0.3s, box-shadow 0.3s",
      }}
      onMouseDown={handleMouseDown}
      onMouseDownCapture={handleStartDrag}
    >
      <div
        className={cn(
          "w-full h-full transition-all duration-200",
          isDragging ? "shadow-[0_10px_20px_rgba(0,0,0,0.7)]" : "shadow-[4px_4px_10px_rgba(0,0,0,0.5)]",
        )}
        style={{
          backgroundColor: "#121212",
          borderRadius: "2px",
          position: "relative",
          overflow: "hidden",
          border: isSelected ? "1px solid rgba(192, 192, 192, 0.5)" : "none",
        }}
      >
        {/* Edge highlight - subtle light reflection on top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
          }}
        ></div>

        {/* Left edge highlight */}
        <div
          className="absolute top-0 left-0 bottom-0 w-[1px] opacity-10"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
          }}
        ></div>

        {/* Corner shadows for subtle curling effect */}
        <div
          className="absolute top-0 left-0 w-[40px] h-[40px] opacity-30"
          style={{
            background: "radial-gradient(circle at 0 0, rgba(0,0,0,0.4) 0%, transparent 70%)",
          }}
        ></div>
        <div
          className="absolute top-0 right-0 w-[60px] h-[60px] opacity-30"
          style={{
            background: "radial-gradient(circle at 100% 0, rgba(0,0,0,0.5) 0%, transparent 70%)",
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-[80px] h-[80px] opacity-40"
          style={{
            background: "radial-gradient(circle at 100% 100%, rgba(0,0,0,0.6) 0%, transparent 70%)",
          }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-[50px] h-[50px] opacity-30"
          style={{
            background: "radial-gradient(circle at 0 100%, rgba(0,0,0,0.5) 0%, transparent 70%)",
          }}
        ></div>

        {/* Interior gradient for depth */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
          }}
        ></div>

        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('data:image/png;base64,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')",
          }}
        ></div>

        {/* Textarea for content */}
        <textarea
          ref={textareaRef}
          className="relative w-full h-full bg-transparent p-5 resize-none border-none focus:outline-none text-gray-300 font-light z-10"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Type your note here..."
          onClick={handleTextareaClick}
          readOnly={!isEditing}
          style={{
            background: "transparent",
            cursor: isEditing ? "text" : isSelected ? "grab" : "pointer",
          }}
        />
      </div>
    </div>
  )
}
