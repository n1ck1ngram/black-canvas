"use client"

import type React from "react"
import { useState, useEffect, useRef, memo } from "react"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

export interface StickyNoteProps {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: { x: number; y: number }) => void
  onDelete?: () => void
  zoom?: number
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number }
}

// Define the component logic
const StickyNoteComponent = ({
  id,
  content,
  position,
  color,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  onDelete,
  zoom = 1,
  screenToCanvas = (x, y) => ({ x, y }),
}: StickyNoteProps) => {
  // Log the received isSelected prop on each render - REMOVED for clarity
  // console.log(`[StickyNote ${id}] Rendering - isSelected prop: ${isSelected}`);
  
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

  // Exit edit mode when the note is deselected
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false)
    }
  }, [isSelected])

  // Handle clicks on the main note div
  const handleMouseDown = (e: React.MouseEvent) => {
    // Stop this click from bubbling up to the document listener
    e.stopPropagation();
    
    // Select the note if not already selected
    if (!isSelected) {
      onSelect();
      return;
    }
  };

  // Handle double click for editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Stop propagation
    e.stopPropagation();

    // Can only enter edit mode if selected
    if (isSelected) {
      setIsEditing(true);
      // Use timeout to ensure focus happens after state update
      setTimeout(() => { 
        textareaRef.current?.focus(); 
      }, 0); 
    }
  };

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

    // Add event listener to handle clicks outside the note
    document.addEventListener("mousedown", handleClickOutside)

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
      onDoubleClick={handleDoubleClick}
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

        {/* Delete button - only show when selected */}
        {isSelected && (
          <button
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            style={{
              cursor: 'pointer',
            }}
          >
            <Trash2 className="w-4 h-4 text-gray-300" />
          </button>
        )}

        {/* Textarea for content */}
        <textarea
          ref={textareaRef}
          className="relative w-full h-full bg-transparent p-5 resize-none border-none focus:outline-none text-gray-300 font-light z-10"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Type your note here..."
          onClick={handleMouseDown}
          readOnly={!isEditing}
          style={{
            background: "transparent",
            cursor: isEditing ? "text" : isSelected ? "grab" : "pointer",
          }}
        />
      </div>
    </div>
  );
};

// Export the memoized version
export const StickyNote = memo(StickyNoteComponent);
