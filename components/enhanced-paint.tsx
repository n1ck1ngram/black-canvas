"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

interface Stroke {
  id: string
  points: { x: number; y: number; size: number }[]
  color: string
}

interface EnhancedPaintProps {
  color: string
  isActive: boolean
  zoom?: number
  pan?: { x: number; y: number }
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number }
  brushSize?: number
  onClearRef?: React.MutableRefObject<(() => void) | null>
  onSelectStroke?: (id: string | null) => void
  selectedStrokeId?: string | null
  alwaysSelectable?: boolean
  stickyToolActive?: boolean
  deleteStrokeRef?: React.MutableRefObject<((id: string) => void) | null>
}

export function EnhancedPaint({
  color,
  isActive,
  zoom = 1,
  pan = { x: 0, y: 0 },
  screenToCanvas = (x, y) => ({ x, y }),
  brushSize: externalBrushSize,
  onClearRef,
  onSelectStroke,
  selectedStrokeId: externalSelectedStrokeId,
  alwaysSelectable = true,
  stickyToolActive = false,
  deleteStrokeRef,
}: EnhancedPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(externalBrushSize || 20)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(externalSelectedStrokeId || null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cursorDataUrl, setCursorDataUrl] = useState<string>("")

  // Update brushSize when externalBrushSize changes
  useEffect(() => {
    if (externalBrushSize) {
      setBrushSize(externalBrushSize)
    }
  }, [externalBrushSize])

  // Update selectedStrokeId when externalSelectedStrokeId changes
  useEffect(() => {
    setSelectedStrokeId(externalSelectedStrokeId || null)
  }, [externalSelectedStrokeId])

  // Expose the clearCanvas function through the ref
  useEffect(() => {
    if (onClearRef) {
      onClearRef.current = clearCanvas
    }

    return () => {
      if (onClearRef) {
        onClearRef.current = null
      }
    }
  }, [onClearRef])

  // Expose the deleteStroke function through the ref
  useEffect(() => {
    if (deleteStrokeRef) {
      deleteStrokeRef.current = deleteStroke
    }

    return () => {
      if (deleteStrokeRef) {
        deleteStrokeRef.current = null
      }
    }
  }, [deleteStrokeRef, strokes])

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const setCanvasSize = () => {
      // Set to the size of the large canvas (10000x10000)
      canvas.width = 10000
      canvas.height = 10000
    }

    setCanvasSize()
  }, [])

  // Generate cursor image based on brush size and color
  useEffect(() => {
    if (!isActive) return

    // Create a canvas to generate the cursor image
    const cursorCanvas = document.createElement("canvas")
    // Make the cursor size directly proportional to the brush size
    const cursorSize = Math.max(brushSize * zoom, 10) // Ensure minimum size for visibility

    // Make canvas large enough to accommodate the cursor
    cursorCanvas.width = cursorSize * 2 + 10
    cursorCanvas.height = cursorSize * 2 + 10

    const ctx = cursorCanvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height)

    const centerX = cursorCanvas.width / 2
    const centerY = cursorCanvas.height / 2
    const radius = cursorSize / 2 // Half the brush size for the cursor radius

    // Draw outer white circle for visibility
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw inner colored circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 3, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Convert to data URL
    const dataUrl = cursorCanvas.toDataURL()
    setCursorDataUrl(dataUrl)

    // Apply cursor to container
    if (containerRef.current) {
      containerRef.current.style.cursor = `url(${dataUrl}) ${centerX} ${centerY}, none`
    }
  }, [isActive, brushSize, color, zoom])

  // Redraw all strokes when they change or when zoom/pan changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all strokes
    strokes.forEach((stroke) => {
      stroke.points.forEach((point) => {
        drawSoftCircle(ctx, point.x, point.y, point.size, stroke.color)
      })
    })

    // Draw selection outline if a stroke is selected
    if (selectedStrokeId) {
      const selectedStroke = strokes.find((s) => s.id === selectedStrokeId)
      if (selectedStroke) {
        drawSelectionOutline(ctx, selectedStroke)
      }
    }
  }, [strokes, selectedStrokeId, zoom, pan])

  // Draw a soft circle with a radial gradient
  const drawSoftCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, strokeColor: string) => {
    ctx.save()

    // Create radial gradient for soft edges
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, strokeColor)
    gradient.addColorStop(0.5, strokeColor + "80") // 50% opacity
    gradient.addColorStop(1, "transparent")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Draw selection outline around a stroke
  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return

    // Find bounding box
    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY

    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x - point.size)
      minY = Math.min(minY, point.y - point.size)
      maxX = Math.max(maxX, point.x + point.size)
      maxY = Math.max(maxY, point.y + point.size)
    })

    // Add padding
    const padding = 5
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    // Draw dashed rectangle
    ctx.save()
    ctx.strokeStyle = "#7c3aed"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
    ctx.restore()
  }

  // Check if a point is in a toolbar area
  const isInToolbarArea = (x: number, y: number): boolean => {
    // Convert canvas coordinates to screen coordinates
    const screenX = x * zoom + pan.x
    const screenY = y * zoom + pan.y

    // Top toolbar area (approx)
    if (screenY < 80) return true

    // Bottom toolbar area (approx)
    if (screenY > window.innerHeight - 120) return true

    // Right side controls
    if (screenX > window.innerWidth - 200 && screenY > window.innerHeight - 200) return true

    return false
  }

  // Track mouse movement for brush preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Convert screen coordinates to canvas coordinates
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)

    // Continue with drawing if needed
    if (isDrawing && isActive && currentStroke) {
      draw(e)
    }
  }

  // Start drawing or select a stroke
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If sticky tool is active, don't handle any clicks
    if (stickyToolActive) return

    // Only allow drawing if the spray tool is active
    const canDraw = isActive

    // Allow selection even if the spray tool is not active (if alwaysSelectable is true)
    const canSelect = isActive || alwaysSelectable

    if (!canDraw && !canSelect) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Convert screen coordinates to canvas coordinates
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const x = canvasCoords.x
    const y = canvasCoords.y

    // Don't draw if clicking in toolbar areas
    if (isInToolbarArea(x, y)) {
      return
    }

    // Check if click is on a stroke
    let clickedStrokeId: string | null = null

    // Check strokes in reverse order (newest first)
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i]

      // Check if click is near any point in the stroke
      const isHit = stroke.points.some((point) => {
        const dx = point.x - x
        const dy = point.y - y
        return Math.sqrt(dx * dx + dy * dy) <= point.size
      })

      if (isHit) {
        clickedStrokeId = stroke.id
        break
      }
    }

    if (clickedStrokeId) {
      // If we clicked on a stroke, select it
      setSelectedStrokeId(clickedStrokeId)
      if (onSelectStroke) {
        onSelectStroke(clickedStrokeId)
      }
      // Stop propagation to prevent canvas click
      e.stopPropagation()
      return
    }

    // Only start a new stroke if the spray tool is active
    if (canDraw) {
      setIsDrawing(true)
      setSelectedStrokeId(null)
      if (onSelectStroke) {
        onSelectStroke(null)
      }

      // Create a new stroke
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}`,
        points: [{ x, y, size: brushSize }],
        color: color,
      }

      setCurrentStroke(newStroke)

      // Draw the first point
      const ctx = canvas.getContext("2d")
      if (ctx) {
        drawSoftCircle(ctx, x, y, brushSize, color)
      }

      // Stop propagation to prevent canvas click
      e.stopPropagation()
    }
  }

  // Continue drawing
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive || !currentStroke) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Convert screen coordinates to canvas coordinates
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const x = canvasCoords.x
    const y = canvasCoords.y

    // Don't draw if in toolbar areas
    if (isInToolbarArea(x, y)) {
      return
    }

    // Calculate distance from last point
    const lastPoint = currentStroke.points[currentStroke.points.length - 1]
    const dx = x - lastPoint.x
    const dy = y - lastPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // If moved a significant distance, add intermediate points for smoother lines
    if (distance > 5) {
      const steps = Math.min(10, Math.floor(distance / 5))

      for (let i = 1; i <= steps; i++) {
        const ratio = i / steps
        const ix = lastPoint.x + dx * ratio
        const iy = lastPoint.y + dy * ratio

        // Skip points in toolbar areas
        if (isInToolbarArea(ix, iy)) continue

        // Add point to current stroke
        currentStroke.points.push({ x: ix, y: iy, size: brushSize })

        // Draw the new point
        drawSoftCircle(ctx, ix, iy, brushSize, color)
      }
    } else {
      // Add point to current stroke
      currentStroke.points.push({ x, y, size: brushSize })

      // Draw the new point
      drawSoftCircle(ctx, x, y, brushSize, color)
    }

    // Update current stroke
    setCurrentStroke({ ...currentStroke })
  }

  // Stop drawing
  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      // Only add the stroke if it has points
      if (currentStroke.points.length > 0) {
        setStrokes((prev) => [...prev, currentStroke])
      }
      setCurrentStroke(null)
    }
    setIsDrawing(false)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    stopDrawing()
  }

  // Delete a specific stroke by ID
  const deleteStroke = (id: string) => {
    // Log for debugging
    console.log("Deleting stroke:", id)

    // Update strokes state
    setStrokes((prevStrokes) => {
      const newStrokes = prevStrokes.filter((stroke) => stroke.id !== id)
      console.log("Strokes before:", prevStrokes.length, "Strokes after:", newStrokes.length)
      return newStrokes
    })

    // Clear selection
    setSelectedStrokeId(null)
    if (onSelectStroke) {
      onSelectStroke(null)
    }
  }

  // Delete selected stroke
  const deleteSelectedStroke = () => {
    if (selectedStrokeId) {
      console.log("Deleting selected stroke:", selectedStrokeId)
      deleteStroke(selectedStrokeId)
      setIsDeleteDialogOpen(false)
    }
  }

  // Show delete confirmation dialog
  const handleDeleteClick = () => {
    // Check if we should show the dialog
    const dontShow = localStorage.getItem("dontShowDeleteConfirmation") === "true"
    if (dontShow) {
      deleteSelectedStroke()
    } else {
      setIsDeleteDialogOpen(true)
    }
  }

  // Clear canvas
  const clearCanvas = () => {
    setStrokes([])
    setSelectedStrokeId(null)
    if (onSelectStroke) {
      onSelectStroke(null)
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: stickyToolActive ? "none" : isActive || alwaysSelectable ? "auto" : "none",
          cursor: isActive ? "none" : "default", // Just use "none" here, we'll set the cursor in useEffect
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Delete button for selected stroke */}
      {selectedStrokeId && (
        <div className="fixed top-20 right-4 z-[9999]">
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-2 shadow-lg"
            onClick={handleDeleteClick}
          >
            <Trash2 size={16} />
            Delete Selection
          </Button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteSelectedStroke}
        itemType="drawing"
      />
    </>
  )
}
