"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useClickAway } from "@/hooks/use-click-away"
import { TypewriterPreview } from './typewriter-preview'

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
  zoom: number
  screenToCanvas: (x: number, y: number) => { x: number; y: number }
  activeTool: string | null
  showPreview: boolean
  previewPosition: { x: number; y: number }
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
  zoom,
  screenToCanvas,
  activeTool,
  showPreview,
  previewPosition,
}: TypewriterToolProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click away from text editor
  useClickAway(containerRef, () => {
    if (isEditing) {
      setIsEditing(false)
      onContentChange(editText)
    }
  })

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only handle left click
    
    // If hand tool is active, do nothing here (let container handle pan)
    if (activeTool === "move") {
      return
    }

    e.stopPropagation()
    onSelect()

    if (isSelected) {
      setIsDragging(true)
      const clickCanvasCoords = screenToCanvas(e.clientX, e.clientY)
      setDragStartOffset({
        x: clickCanvasCoords.x - position.x,
        y: clickCanvasCoords.y - position.y,
      })
    }
  }

  // Handle double click to start editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      setIsEditing(true)
      setEditText(content)
    }
  }

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(content)
    }
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const currentCanvasCoords = screenToCanvas(e.clientX, e.clientY)
    const newPosition = {
      x: currentCanvasCoords.x - dragStartOffset.x,
      y: currentCanvasCoords.y - dragStartOffset.y,
    }

    onPositionChange(newPosition)
  }

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Calculate dimensions
  const width = 400
  const height = 300

  return (
    <div
      ref={containerRef}
      data-interactive="true"
      className={cn(
        "absolute cursor-default select-none",
        isDragging && "cursor-grabbing",
        isSelected && "z-10"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Typewriter Paper */}
      <div 
        className={cn(
          "w-full h-full bg-white shadow-lg p-6",
          "border border-[#d4d4d4]",
          isSelected && "ring-2 ring-blue-500"
        )}
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: `${fontSize}px`,
          color: "#2C2C2C",
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          borderRadius: '2px',
          boxShadow: '3px 3px 10px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent resize-none outline-none border-none"
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: `${fontSize}px`,
              color: "#2C2C2C",
              lineHeight: '1.5',
              minHeight: '280px'
            }}
            placeholder="Start typing..."
          />
        ) : (
          <div className="w-full h-full min-h-[280px]">
            {content || (isSelected ? "Double-click to add text" : "")}
          </div>
        )}
      </div>

      {showPreview && (
        <TypewriterPreview
          position={previewPosition}
          zoom={zoom}
          content={content}
          fontSize={fontSize}
          color={color}
        />
      )}
    </div>
  )
}
