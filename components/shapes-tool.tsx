import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useClickAway } from "@/hooks/use-click-away"
import { HexColorPicker } from "react-colorful"
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, ChevronUp, ChevronDown } from "lucide-react"

// Define shape types
export type ShapeType = 
  | "rectangle" 
  | "circle" 
  | "diamond" 
  | "triangle" 
  | "invertedTriangle" 
  | "parallelogram" 
  | "arrow"

interface Shape {
  id: string
  type: ShapeType
  position: { x: number; y: number }
  size: { width: number; height: number }
  color: string
  content: string
  style: {
    fontSize: number
    fontFamily: string
    alignment: 'left' | 'center' | 'right'
    isBold: boolean
    isItalic: boolean
    textColor: string
  }
}

interface ShapesToolProps {
  id: string
  shape: Shape
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: { x: number; y: number }) => void
  onStyleChange: (style: Partial<Shape['style']>) => void
  zoom: number
  screenToCanvas: (x: number, y: number) => { x: number; y: number }
  activeTool: string | null
}

// Add ResizeHandle component
const ResizeHandle = ({ position, onMouseDown }: { 
  position: 'nw' | 'ne' | 'se' | 'sw', 
  onMouseDown: (e: React.MouseEvent) => void 
}) => {
  const getHandleStyle = () => {
    switch (position) {
      case 'nw': return 'top-0 left-0 cursor-nw-resize'
      case 'ne': return 'top-0 right-0 cursor-ne-resize'
      case 'se': return 'bottom-0 right-0 cursor-se-resize'
      case 'sw': return 'bottom-0 left-0 cursor-sw-resize'
    }
  }

  return (
    <div
      className={cn(
        'absolute w-3 h-3 bg-white border-2 border-[#4B9FFF] rounded-sm',
        getHandleStyle()
      )}
      onMouseDown={onMouseDown}
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  )
}

// Add StyleToolbar component
const StyleToolbar = ({ 
  style, 
  onStyleChange,
  position
}: { 
  style: Shape['style'],
  onStyleChange: (style: Partial<Shape['style']>) => void,
  position: { x: number, y: number }
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <div 
      className="absolute bg-[#1a1a1a] border border-white/10 rounded-lg p-2 flex items-center gap-2 shadow-lg"
      style={{ 
        top: position.y - 50,
        left: position.x,
        zIndex: 1000
      }}
    >
      {/* Font size controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-1 hover:bg-white/10 rounded"
          onClick={() => onStyleChange({ fontSize: style.fontSize - 2 })}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <span className="text-sm w-6 text-center">{style.fontSize}</span>
        <button
          className="p-1 hover:bg-white/10 rounded"
          onClick={() => onStyleChange({ fontSize: style.fontSize + 2 })}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-white/20" /> {/* Divider */}

      {/* Text alignment */}
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "p-1 hover:bg-white/10 rounded",
            style.alignment === 'left' && "bg-white/20"
          )}
          onClick={() => onStyleChange({ alignment: 'left' })}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          className={cn(
            "p-1 hover:bg-white/10 rounded",
            style.alignment === 'center' && "bg-white/20"
          )}
          onClick={() => onStyleChange({ alignment: 'center' })}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          className={cn(
            "p-1 hover:bg-white/10 rounded",
            style.alignment === 'right' && "bg-white/20"
          )}
          onClick={() => onStyleChange({ alignment: 'right' })}
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-white/20" /> {/* Divider */}

      {/* Text style */}
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "p-1 hover:bg-white/10 rounded",
            style.isBold && "bg-white/20"
          )}
          onClick={() => onStyleChange({ isBold: !style.isBold })}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          className={cn(
            "p-1 hover:bg-white/10 rounded",
            style.isItalic && "bg-white/20"
          )}
          onClick={() => onStyleChange({ isItalic: !style.isItalic })}
        >
          <Italic className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-white/20" /> {/* Divider */}

      {/* Text color */}
      <div className="relative">
        <button
          className="w-6 h-6 rounded border border-white/20"
          style={{ backgroundColor: style.textColor }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-2 shadow-lg">
            <HexColorPicker
              color={style.textColor}
              onChange={(color) => {
                onStyleChange({ textColor: color })
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function ShapesTool({
  id,
  shape,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  onStyleChange,
  zoom,
  screenToCanvas,
  activeTool,
}: ShapesToolProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(shape.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | null>(null)

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

  // Handle double click to start editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      setIsEditing(true)
      setEditText(shape.content)
    }
  }

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      onContentChange(editText)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(shape.content)
    }
  }

  // Function to render the appropriate SVG shape
  const renderShape = () => {
    const width = shape.size.width
    const height = shape.size.height

    switch (shape.type) {
      case "rectangle":
        return <rect width={width} height={height} fill={shape.color} rx="4" />
      case "circle":
        return <circle cx={width/2} cy={height/2} r={Math.min(width, height)/2} fill={shape.color} />
      case "diamond":
        return (
          <polygon
            points={`${width/2},0 ${width},${height/2} ${width/2},${height} 0,${height/2}`}
            fill={shape.color}
          />
        )
      case "triangle":
        return (
          <polygon
            points={`${width/2},0 ${width},${height} 0,${height}`}
            fill={shape.color}
          />
        )
      case "invertedTriangle":
        return (
          <polygon
            points={`0,0 ${width},0 ${width/2},${height}`}
            fill={shape.color}
          />
        )
      case "parallelogram":
        return (
          <polygon
            points={`20,0 ${width},0 ${width-20},${height} 0,${height}`}
            fill={shape.color}
          />
        )
      case "arrow":
        return (
          <path
            d={`M0,${height/2} H${width-20} L${width-10},${height/4} L${width},${height/2} L${width-10},${height*3/4} L${width-20},${height/2}`}
            fill={shape.color}
            strokeLinejoin="round"
          />
        )
      default:
        return null
    }
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return // Only handle left click, ignore if editing
    
    e.stopPropagation()
    onSelect() // Select first
    setIsDragging(true)

    // Calculate initial canvas coords of the click
    const clickCanvasCoords = screenToCanvas(e.clientX, e.clientY)
    
    // Calculate and store the offset from the shape's top-left corner
    setDragStartOffset({
      x: clickCanvasCoords.x - shape.position.x,
      y: clickCanvasCoords.y - shape.position.y,
    })
    
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    e.preventDefault(); // Prevent text selection etc. during drag

    // Get current mouse position in canvas coordinates
    const currentCanvasCoords = screenToCanvas(e.clientX, e.clientY);

    // Calculate new top-left position by subtracting the start offset
    const newPosition = {
      x: currentCanvasCoords.x - dragStartOffset.x,
      y: currentCanvasCoords.y - dragStartOffset.y,
    };

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
  }, [isDragging])

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'se' | 'sw') => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    setResizeStartPos({
      x: canvasCoords.x,
      y: canvasCoords.y
    })
    setResizeStartSize({
      width: shape.size.width,
      height: shape.size.height
    })
  }

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return
    e.preventDefault()

    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    const deltaX = canvasCoords.x - resizeStartPos.x
    const deltaY = canvasCoords.y - resizeStartPos.y

    let newWidth = resizeStartSize.width
    let newHeight = resizeStartSize.height
    let newX = shape.position.x
    let newY = shape.position.y

    // Calculate new size and position based on resize handle
    switch (resizeHandle) {
      case 'se':
        newWidth = Math.max(50, resizeStartSize.width + deltaX)
        newHeight = Math.max(50, resizeStartSize.height + deltaY)
        break
      case 'sw':
        newWidth = Math.max(50, resizeStartSize.width - deltaX)
        newHeight = Math.max(50, resizeStartSize.height + deltaY)
        newX = shape.position.x + (resizeStartSize.width - newWidth)
        break
      case 'ne':
        newWidth = Math.max(50, resizeStartSize.width + deltaX)
        newHeight = Math.max(50, resizeStartSize.height - deltaY)
        newY = shape.position.y + (resizeStartSize.height - newHeight)
        break
      case 'nw':
        newWidth = Math.max(50, resizeStartSize.width - deltaX)
        newHeight = Math.max(50, resizeStartSize.height - deltaY)
        newX = shape.position.x + (resizeStartSize.width - newWidth)
        newY = shape.position.y + (resizeStartSize.height - newHeight)
        break
    }

    // Update position and size
    onPositionChange({ x: newX, y: newY })
    const newSize = { width: newWidth, height: newHeight }
    // Add size property to Shape interface if it doesn't exist
    ;(shape as any).size = newSize
  }

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeHandle(null)
  }

  // Add resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing, resizeStartPos.x, resizeStartPos.y, resizeStartSize.width, resizeStartSize.height, resizeHandle])

  // Calculate toolbar position
  const getToolbarPosition = () => {
    return {
      x: shape.position.x,
      y: shape.position.y
    }
  }

  return (
    <>
      {/* Style toolbar */}
      {isSelected && !isEditing && !isDragging && !isResizing && (
        <StyleToolbar
          style={shape.style}
          onStyleChange={onStyleChange}
          position={getToolbarPosition()}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          "absolute select-none",
          isSelected && "ring-2 ring-[#4B9FFF]",
          isResizing ? "cursor-grabbing" : "cursor-move"
        )}
        style={{
          transform: `translate(${shape.position.x}px, ${shape.position.y}px)`,
          width: shape.size.width,
          height: shape.size.height,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        data-interactive="true"
      >
        <svg
          width={shape.size.width}
          height={shape.size.height}
          viewBox={`0 0 ${shape.size.width} ${shape.size.height}`}
          className="absolute top-0 left-0"
        >
          {renderShape()}
        </svg>
        
        {/* Text content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 bg-transparent text-center resize-none outline-none border-none p-2 w-full h-full"
            style={{
              fontFamily: shape.style.fontFamily,
              fontSize: shape.style.fontSize,
              textAlign: shape.style.alignment,
              fontWeight: shape.style.isBold ? 'bold' : 'normal',
              fontStyle: shape.style.isItalic ? 'italic' : 'normal',
              color: shape.style.textColor,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center p-2"
            style={{
              fontFamily: shape.style.fontFamily,
              fontSize: shape.style.fontSize,
              textAlign: shape.style.alignment,
              fontWeight: shape.style.isBold ? 'bold' : 'normal',
              fontStyle: shape.style.isItalic ? 'italic' : 'normal',
              color: shape.style.textColor,
            }}
          >
            {shape.content}
          </div>
        )}

        {/* Resize handles - only show when selected */}
        {isSelected && !isEditing && (
          <>
            <ResizeHandle position="nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <ResizeHandle position="ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <ResizeHandle position="se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
            <ResizeHandle position="sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          </>
        )}
      </div>
    </>
  )
} 