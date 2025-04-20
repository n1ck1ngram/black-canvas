"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

interface Point {
  x: number
  y: number
  size: number
  penTip?: 'round' | 'rectangle'
}

interface Stroke {
  id: string
  points: Point[]
  color: string
  opacity: number
}

interface PenToolProps {
  color: string
  isActive: boolean
  zoom: number
  pan: { x: number; y: number }
  screenToCanvas: (x: number, y: number) => { x: number; y: number }
  brushSize: number
  onClearRef: React.MutableRefObject<(() => void) | null>
  onSelectStroke: (id: string | null) => void
  selectedStrokeId: string | null
  alwaysSelectable?: boolean
  stickyToolActive?: boolean
  deleteStrokeRef: React.MutableRefObject<((id: string) => void) | null>
  activeTool: string | null
  onBackgroundClick?: () => void
  onColorSelect?: (color: string) => void
  selectedColor?: string
  onBrushSizeChange?: (size: number) => void
  penTip?: 'round' | 'rectangle'
  opacity?: number
}

// Simplify pen tips to round and rectangle
const PenTip = {
  ROUND: 'round',
  RECTANGLE: 'rectangle',
};

export function PenTool({
  color,
  isActive,
  zoom,
  pan,
  screenToCanvas,
  brushSize: externalBrushSize,
  onClearRef,
  onSelectStroke,
  selectedStrokeId: externalSelectedStrokeId,
  alwaysSelectable = false,
  stickyToolActive = false,
  deleteStrokeRef,
  activeTool,
  onBackgroundClick,
  onColorSelect,
  selectedColor,
  onBrushSizeChange,
  penTip = 'round',
  opacity = 1,
}: PenToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(externalBrushSize)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(externalSelectedStrokeId)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cursorDataUrl, setCursorDataUrl] = useState<string>("")
  const lastCursorProps = useRef({ color, brushSize, zoom })
  const [pointerEventsStyle, setPointerEventsStyle] = useState<"none" | "auto">("none")

  // Update brushSize when externalBrushSize changes
  useEffect(() => {
    if (externalBrushSize) {
      setBrushSize(externalBrushSize)
    }
  }, [externalBrushSize])

  // Update selectedStrokeId when externalSelectedStrokeId changes
  useEffect(() => {
    setSelectedStrokeId(externalSelectedStrokeId)
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
      const container = containerRef.current
      if (!container) return

      // Get the container's bounding rectangle
      const rect = container.getBoundingClientRect()

      // Set canvas dimensions to match container
      canvas.width = 10000
      canvas.height = 10000

      // Set canvas style dimensions to match container
      canvas.style.width = "100%"
      canvas.style.height = "100%"
    }

    setCanvasSize()

    // Add resize listener
    window.addEventListener("resize", setCanvasSize)

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  // Create a reusable cursor canvas
  useEffect(() => {
    if (!cursorCanvasRef.current) {
      cursorCanvasRef.current = document.createElement("canvas")
    }
  }, [])

  // Update cursor when relevant props change
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCursorStyle = () => {
      if (!isActive) {
        containerRef.current?.style.setProperty("cursor", "default", "important");
        return;
      }

      try {
        // Create cursor canvas
        const cursorSize = Math.max(brushSize * zoom, 10);
        const canvas = document.createElement("canvas");
        const padding = 4; // Add padding for the outer stroke
        
        // For rectangle tip, make the canvas taller to accommodate vertical shape
        if (penTip === 'rectangle') {
          canvas.width = cursorSize + padding * 2;
          canvas.height = (cursorSize * 1.5) + padding * 2; // Make height 1.5x the width for vertical rectangle
        } else {
          canvas.width = cursorSize + padding * 2;
          canvas.height = cursorSize + padding * 2;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        if (penTip === 'rectangle') {
          // Calculate rectangle dimensions
          const rectWidth = cursorSize;
          const rectHeight = cursorSize * 1.5; // Make height 1.5x the width
          
          // Draw outer rectangle (white)
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(
            centerX - rectWidth / 2,
            centerY - rectHeight / 2,
            rectWidth,
            rectHeight
          );

          // Draw inner rectangle (color)
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(
            centerX - rectWidth / 2 + 1,
            centerY - rectHeight / 2 + 1,
            rectWidth - 2,
            rectHeight - 2
          );

          // Add a small dot in the center for precision
          ctx.beginPath();
          ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
        } else {
          // Original circular cursor
          ctx.beginPath();
          ctx.arc(centerX, centerY, cursorSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw inner circle (color)
          ctx.beginPath();
          ctx.arc(centerX, centerY, cursorSize / 2 - 1, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Add a small dot in the center for precision
          ctx.beginPath();
          ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
        }

        // Convert to data URL with explicit PNG format
        const dataUrl = canvas.toDataURL('image/png');

        // Apply cursor with important flag and center it
        if (containerRef.current) {
          containerRef.current.style.setProperty(
            "cursor",
            `url("${dataUrl}") ${centerX} ${centerY}, crosshair`,
            "important"
          );
        }
      } catch (error) {
        // Fallback to crosshair if there's an error
        if (containerRef.current) {
          containerRef.current.style.setProperty("cursor", "crosshair", "important");
        }
      }
    };

    // Update immediately and set up an interval to ensure cursor persists
    updateCursorStyle();
    const intervalId = setInterval(updateCursorStyle, 100);

    return () => {
      clearInterval(intervalId);
      if (containerRef.current) {
        containerRef.current.style.setProperty("cursor", "default", "important");
      }
    };
  }, [isActive, color, brushSize, zoom, penTip]);

  // Update draw function to handle both brush types with continuous strokes
  const draw = useCallback((ctx: CanvasRenderingContext2D, points: Point[], strokeColor: string, size: number, strokeOpacity: number = 1) => {
    if (!ctx || points.length < 1) return

    ctx.save()
    
    // Parse the hex color and create rgba
    let r, g, b;
    if (strokeColor.startsWith('#')) {
      r = parseInt(strokeColor.slice(1, 3), 16)
      g = parseInt(strokeColor.slice(3, 5), 16)
      b = parseInt(strokeColor.slice(5, 7), 16)
    } else {
      r = g = b = 255
    }

    // Store the stroke type with the points
    const strokeType = points[0].penTip || penTip

    // Common setup for both brush types
    ctx.globalAlpha = strokeOpacity
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.lineWidth = size / zoom

    if (strokeType === 'rectangle') {
      // Highlighter-style drawing with square ends
      ctx.lineCap = 'butt'
      ctx.lineJoin = 'miter'
    } else {
      // Pen tool drawing with round ends
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    
    // Draw the continuous stroke for both types
    ctx.beginPath()
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y)
    }
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    ctx.stroke()

    ctx.restore()
  }, [zoom, penTip])

  // Update handleMouseMove for smoother continuous strokes
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive || !currentStroke) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const x = canvasCoords.x
    const y = canvasCoords.y

    if (isInToolbarArea(x, y)) return

    const newPoint: Point = { x, y, size: brushSize, penTip }
    const updatedPoints = [...currentStroke.points, newPoint]
    const updatedStroke = { ...currentStroke, points: updatedPoints }
    setCurrentStroke(updatedStroke)

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw existing strokes
    strokes.forEach((stroke: Stroke) => {
      if (stroke.points.length > 0) {
        draw(ctx, stroke.points, stroke.color, stroke.points[0].size, stroke.opacity)
      }
    })

    // Draw current stroke
    if (updatedStroke.points.length > 0) {
      draw(ctx, updatedStroke.points, updatedStroke.color, brushSize, updatedStroke.opacity)
    }

    // Draw selection outline if needed
    if (selectedStrokeId) {
      const selectedStroke = strokes.find((s: Stroke) => s.id === selectedStrokeId)
      if (selectedStroke) {
        drawSelectionOutline(ctx, selectedStroke)
      }
    }
  }

  // Update startDrawing to store the pen tip type with the stroke
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "move") return
    if (stickyToolActive) return

    const canDraw = isActive
    const canSelect = activeTool === "pointer" || isActive

    if (!canDraw && !canSelect) return

    const canvas = canvasRef.current
    if (!canvas) return

    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const x = canvasCoords.x
    const y = canvasCoords.y

    if (isInToolbarArea(x, y)) return

    // Handle selection logic
    let clickedStrokeId: string | null = null
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i]
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
      if (canSelect) {
        setSelectedStrokeId(clickedStrokeId)
        onSelectStroke?.(clickedStrokeId)
        e.stopPropagation()
      }
      return
    }

    // Handle drawing initialization
    if (canDraw) {
      setIsDrawing(true)
      setSelectedStrokeId(null)
      onSelectStroke?.(null)

      const newStroke: Stroke = {
        id: `stroke-${Date.now()}`,
        points: [{ x, y, size: brushSize, penTip }], // Store penTip with the point
        color: color,
        opacity: opacity
      }
      setCurrentStroke(newStroke)

      // Initialize the context for the stroke
      const ctx = canvas.getContext("2d")
      if (ctx && penTip === 'rectangle') {
        ctx.globalAlpha = opacity
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize / zoom
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
      }

      e.stopPropagation()
    } else {
      if (onBackgroundClick) {
        onBackgroundClick()
      }
    }
  }

  // Update useEffect for redrawing strokes to handle opacity
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach((stroke: Stroke) => {
      if (stroke.points.length > 0) {
        draw(ctx, stroke.points, stroke.color, stroke.points[0].size, stroke.opacity)
      }
    })

    if (selectedStrokeId) {
      const selectedStroke = strokes.find((s: Stroke) => s.id === selectedStrokeId)
      if (selectedStroke) {
        drawSelectionOutline(ctx, selectedStroke)
      }
    }
  }, [strokes, selectedStrokeId, zoom, pan, draw])

  // Draw a hard circle - No longer the primary drawing method for lines
  const drawHardCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, strokeColor: string) => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = strokeColor
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

  // Handle pointer events style after initial render
  useEffect(() => {
    let newPointerEvents: "none" | "auto";
    
    // Only enable pointer events when:
    // 1. The pen tool is active (isActive is true)
    // 2. OR we're in pointer mode and want to allow stroke selection
    if (isActive || (activeTool === 'pointer' && alwaysSelectable)) {
      newPointerEvents = "auto";
    } else {
      newPointerEvents = "none";
    }

    setPointerEventsStyle(newPointerEvents);
  }, [isActive, activeTool, alwaysSelectable]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length > 0) {
        draw(ctx, stroke.points, stroke.color, stroke.points[0].size, stroke.opacity)
      }
    })

    // Draw current stroke if exists
    if (currentStroke?.points.length) {
      draw(ctx, currentStroke.points, currentStroke.color, currentStroke.points[0].size, currentStroke.opacity)
    }
  }, [strokes, currentStroke, draw])

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 z-10"
                    style={{
          pointerEvents: pointerEventsStyle,
          // Ensure paint layer is below other interactive elements when not active
          zIndex: isActive ? 10 : 1
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
              
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteSelectedStroke}
        itemType="drawing"
      />
    </>
  )
} 