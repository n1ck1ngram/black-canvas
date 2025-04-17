"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SimpleTextProps {
  id: string
  content: string
  position: { x: number; y: number }
  color?: string // Optional, defaults to white
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: { x: number; y: number }) => void
  zoom?: number
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number }
  activeTool?: string | null
}

export function SimpleText({
  id,
  content,
  position,
  color = "#FFFFFF", // Default to white
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  zoom = 1,
  screenToCanvas = (x, y) => ({ x, y }),
  activeTool = null,
}: SimpleTextProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus the textarea when editing mode is activated
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Auto-resize textarea
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing])

  // Auto-resize textarea on content change
  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content, isEditing])

  // Handle double click for editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (activeTool === 'move') return; // Don't edit if move tool active
    e.stopPropagation();
    if (isSelected) {
      setIsEditing(true);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const canvasCoords = screenToCanvas(e.clientX, e.clientY)
      const newPosition = {
        x: canvasCoords.x - dragOffset.x,
        y: canvasCoords.y - dragOffset.y,
      }
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

  // Handle main div click/mousedown
   const handleMouseDown = (e: React.MouseEvent) => {
     // Left button only
     if (e.button !== 0) return;

     if (activeTool === 'move') {
       e.stopPropagation(); // Stop propagation ONLY for move tool to allow container pan
       return;
     }
     
     // Prevent interfering with double-click and text selection inside textarea
     if (isEditing && e.target === textareaRef.current) {
        // Don't set handled ref, allow default text interactions
        return;
     }

     e.stopPropagation(); // Stop propagation since this element handled the click

     // Select if not selected
     if (!isSelected) {
       onSelect();
     }
     
     // Initiate drag state only if not editing
     if (!isEditing) {
         setIsDragging(true);
         // Calculate drag offset in canvas coordinates
         const canvasCoords = screenToCanvas(e.clientX, e.clientY);
         setDragOffset({
             x: canvasCoords.x - position.x,
             y: canvasCoords.y - position.y,
         });
     }
   };

  return (
    <div
      ref={textRef}
      className={cn(
        "absolute p-1", // Minimal padding
        activeTool === 'move' ? "pointer-events-none" :
          (isDragging ? "cursor-grabbing" : isEditing ? "cursor-text" : "cursor-pointer"), // Use pointer cursor as default
        isSelected && !isEditing && "border border-dashed border-blue-500" // Simple dashed border when selected (not editing)
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
        color: color,
        transition: isDragging ? "none" : "transform 0.3s, box-shadow 0.3s",
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown} // Use combined handler
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="bg-transparent resize-none border border-blue-500 focus:outline-none p-0 m-0 block" // Minimal styling, block display
          value={content}
          onChange={(e) => {
              onContentChange(e.target.value);
              // Auto-resize on change
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder="Type something..."
          onClick={(e) => e.stopPropagation()} // Prevent click from propagating when editing
          onBlur={() => setIsEditing(false)} // Exit editing on blur
          style={{
            fontSize: `16px`, // Default font size
            color: color,
            fontFamily: "inherit", // Use default font
            lineHeight: "1.2",
            minWidth: "10px",
            minHeight: "1.2em", // Minimum height based on line height
            width: "auto",
            height: "auto",
            overflow: "hidden", // Hide scrollbar
          }}
        />
      ) : (
        <div
          className="whitespace-pre-wrap break-words min-h-[1.2em]" // Ensure min height for empty text
          style={{
            fontSize: `16px`,
            fontFamily: "inherit",
            lineHeight: "1.2",
          }}
        >
          {content || <span className="opacity-50 italic">Double-click to edit...</span>}
        </div>
      )}
    </div>
  )
} 