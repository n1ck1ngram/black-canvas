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
  onSizeChange: (size: { width: number; height: number }) => void
  zoom: number
  screenToCanvas: (x: number, y: number) => { x: number; y: number }
  activeTool: string | null
  onShapeColorChange: (id: string, color: string) => void
}

// Add ResizeHandle component
const ResizeHandle = ({ position, onMouseDown }: { 
  position: 'nw' | 'ne' | 'se' | 'sw', 
  onMouseDown: (e: React.MouseEvent) => void 
}) => {
  const getHandleStyle = () => {
    switch (position) {
      case 'nw': return 'top-0 left-0 cursor-nw-resize -translate-x-[8px] -translate-y-[8px]'
      case 'ne': return 'top-0 right-0 cursor-ne-resize translate-x-[8px] -translate-y-[8px]'
      case 'se': return 'bottom-0 right-0 cursor-se-resize translate-x-[8px] translate-y-[8px]'
      case 'sw': return 'bottom-0 left-0 cursor-sw-resize -translate-x-[8px] translate-y-[8px]'
    }
  }

  return (
    <div
      className={cn(
        'absolute w-4 h-4 bg-white border-2 border-[#4B9FFF] rounded-sm',
        getHandleStyle()
      )}
      onMouseDown={onMouseDown}
    />
  )
}

// Add StyleToolbar component
const StyleToolbar = ({ 
  style, 
  onStyleChange,
  position,
  shapeColor,
  onShapeColorChange,
}: { 
  style: Shape['style'],
  onStyleChange: (style: Partial<Shape['style']>) => void,
  position: { x: number, y: number },
  shapeColor: string,
  onShapeColorChange: (color: string) => void
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Handle click away for color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  const handleColorChange = (color: string) => {
    onShapeColorChange(color)
    onStyleChange({ textColor: color })
  }

  return (
    <div 
      className="absolute bg-[#1a1a1a] border border-white/10 rounded-lg p-2 flex items-center gap-2 shadow-lg"
      style={{ 
        top: position.y - 50,
        left: position.x + 100,
        transform: 'translateY(-100%)',
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="relative" 
        ref={colorPickerRef}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className="w-8 h-8 rounded-md border border-white/20 transition-colors hover:bg-white/10"
          style={{ backgroundColor: shapeColor }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowColorPicker(!showColorPicker)
          }}
        />
        {showColorPicker && (
          <div 
            className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-2 shadow-lg"
            style={{ 
              zIndex: 1001,
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <HexColorPicker
              color={shapeColor}
              onChange={handleColorChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Add a utility function for calculating dynamic font size
const calculateDynamicFontSize = (width: number, height: number, textLength: number): number => {
  // Base size on the smaller dimension to ensure text fits
  const minDimension = Math.min(width, height)
  
  // Start with a base size that's proportional to the shape
  let baseSize = minDimension * 0.15 // 15% of the minimum dimension
  
  // Adjust based on text length
  if (textLength > 0) {
    // Reduce size for longer text
    const reductionFactor = Math.max(0.5, 1 - (textLength * 0.02))
    baseSize *= reductionFactor
  }
  
  // Enforce minimum and maximum sizes
  return Math.min(Math.max(12, baseSize), 48) // Min: 12px, Max: 48px
}

// Add a function to get shape-specific padding
const getShapePadding = (shapeType: ShapeType): { padding?: string, paddingTop?: string, display?: string, alignItems?: string, justifyContent?: string } => {
  switch (shapeType) {
    case 'circle':
      return { 
        padding: '25%',
        paddingTop: '35%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    case 'triangle':
      return { 
        padding: '25%',
        paddingTop: '48%'
      }
    case 'diamond':
      return { 
        padding: '25%',
        paddingTop: '35%'
      }
    case 'invertedTriangle':
      return { 
        padding: '25%',
        paddingTop: '15%'
      }
    default:
      return { 
        padding: '12%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
  }
}

export function ShapesTool({
  id,
  shape,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  onStyleChange,
  onSizeChange,
  zoom,
  screenToCanvas,
  activeTool,
  onShapeColorChange,
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
      setIsEditing(false);
      onContentChange(editText);
    }
  });

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Handle mouse down for dragging and selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    // If hand tool is active, do nothing here (let container handle pan)
    if (activeTool === "move") {
      return;
    }

    // Handle selection when pointer tool is active
    if (activeTool === "pointer" || isSelected) {
      e.stopPropagation();
      onSelect();
      
      if (isSelected) {
        setIsDragging(true);
        const clickCanvasCoords = screenToCanvas(e.clientX, e.clientY);
        setDragStartOffset({
          x: clickCanvasCoords.x - shape.position.x,
          y: clickCanvasCoords.y - shape.position.y,
        });
      }
    }
  };

  // Handle double click to start editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && shape.type !== 'arrow') {
      setIsEditing(true);
      setEditText(shape.content);
    }
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value)
  }

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onContentChange(editText);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(shape.content);
    }
  };

  // Function to render the appropriate SVG shape
  const renderShape = () => {
    const width = shape.size.width
    const height = shape.size.height
    const strokeWidth = 4
    const filterId = `glow-${shape.id}`

    return (
      <>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            {/* Inner glow */}
            <feGaussianBlur stdDeviation="2" result="blur1" />
            <feFlood floodColor={shape.color} floodOpacity="0.8" result="color1"/>
            <feComposite in="color1" in2="blur1" operator="in" result="innerGlow"/>

            {/* Outer glow */}
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feFlood floodColor={shape.color} floodOpacity="0.6" result="color2"/>
            <feComposite in="color2" in2="blur2" operator="in" result="outerGlow"/>

            {/* Combine glows with original */}
            <feMerge>
              <feMergeNode in="outerGlow"/>
              <feMergeNode in="innerGlow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {(() => {
          const shapeProps = {
            fill: "none",
            stroke: shape.color,
            strokeWidth: strokeWidth,
            filter: `url(#${filterId})`,
            style: {
              filter: `url(#${filterId})`,
              dropShadow: `0 0 10px ${shape.color}`
            }
          }

          switch (shape.type) {
            case "rectangle":
              return <rect 
                width={width} 
                height={height}
                rx="4"
                {...shapeProps}
              />
            case "circle":
              return <circle 
                cx={width/2} 
                cy={height/2} 
                r={Math.max(0, Math.min(width, height)/2 - strokeWidth/2)}
                {...shapeProps}
              />
            case "diamond":
              return (
                <polygon
                  points={`${width/2},${strokeWidth/2} ${width - strokeWidth/2},${height/2} ${width/2},${height - strokeWidth/2} ${strokeWidth/2},${height/2}`}
                  {...shapeProps}
                  strokeLinejoin="round"
                />
              )
            case "triangle":
              return (
                <polygon
                  points={`${width/2},${strokeWidth/2} ${width - strokeWidth/2},${height - strokeWidth/2} ${strokeWidth/2},${height - strokeWidth/2}`}
                  {...shapeProps}
                  strokeLinejoin="round"
                />
              )
            case "invertedTriangle":
              return (
                <polygon
                  points={`${strokeWidth/2},${strokeWidth/2} ${width - strokeWidth/2},${strokeWidth/2} ${width/2},${height - strokeWidth/2}`}
                  {...shapeProps}
                  strokeLinejoin="round"
                />
              )
            case "parallelogram":
              const skewOffset = 20
              return (
                <polygon
                  points={`${skewOffset + strokeWidth/2},${strokeWidth/2} ${width - strokeWidth/2},${strokeWidth/2} ${width-skewOffset - strokeWidth/2},${height - strokeWidth/2} ${strokeWidth/2},${height - strokeWidth/2}`}
                  {...shapeProps}
                  strokeLinejoin="round"
                />
              )
            case "arrow":
              const arrowHeadSize = Math.min(20, width * 0.2, height * 0.4)
              const shaftLength = width - arrowHeadSize - strokeWidth
              const arrowY = height / 2
              return (
                <path
                  d={`M${strokeWidth/2},${arrowY} H${shaftLength} L${shaftLength + arrowHeadSize/2},${arrowY - arrowHeadSize/2} L${shaftLength + arrowHeadSize},${arrowY} L${shaftLength + arrowHeadSize/2},${arrowY + arrowHeadSize/2} L${shaftLength},${arrowY}`}
                  {...shapeProps}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )
            default:
              return null
          }
        })()}
      </>
    )
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
  }, [isDragging, handleMouseMove, handleMouseUp])

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

    // Calculate the original aspect ratio
    const aspectRatio = resizeStartSize.width / resizeStartSize.height

    let newWidth = resizeStartSize.width
    let newHeight = resizeStartSize.height
    let newX = shape.position.x
    let newY = shape.position.y

    // Calculate new dimensions maintaining aspect ratio
    const calculateNewDimensions = (delta: number, isHorizontal: boolean) => {
      if (isHorizontal) {
        const width = Math.max(50, resizeStartSize.width + delta)
        return {
          width,
          height: width / aspectRatio
        }
      } else {
        const height = Math.max(50, resizeStartSize.height + delta)
        return {
          width: height * aspectRatio,
          height
        }
      }
    }

    // Calculate new size and position based on resize handle
    switch (resizeHandle) {
      case 'se': {
        // Use the larger of the deltas to determine primary resize direction
        const useHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        const newDims = calculateNewDimensions(useHorizontal ? deltaX : deltaY, useHorizontal)
        newWidth = newDims.width
        newHeight = newDims.height
        break
      }
      case 'sw': {
        const useHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        const newDims = calculateNewDimensions(useHorizontal ? -deltaX : deltaY, useHorizontal)
        newWidth = newDims.width
        newHeight = newDims.height
        newX = shape.position.x + (resizeStartSize.width - newWidth)
        break
      }
      case 'ne': {
        const useHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        const newDims = calculateNewDimensions(useHorizontal ? deltaX : -deltaY, useHorizontal)
        newWidth = newDims.width
        newHeight = newDims.height
        newY = shape.position.y + (resizeStartSize.height - newHeight)
        break
      }
      case 'nw': {
        const useHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        const newDims = calculateNewDimensions(useHorizontal ? -deltaX : -deltaY, useHorizontal)
        newWidth = newDims.width
        newHeight = newDims.height
        newX = shape.position.x + (resizeStartSize.width - newWidth)
        newY = shape.position.y + (resizeStartSize.height - newHeight)
        break
      }
    }

    // Ensure minimum size
    if (newWidth >= 50 && newHeight >= 50) {
      onPositionChange({ x: newX, y: newY })
      onSizeChange({ width: newWidth, height: newHeight })
    }
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

  // Add text size calculation
  const getFontSize = () => {
    if (!shape.content) return shape.style.fontSize
    return calculateDynamicFontSize(
      shape.size.width,
      shape.size.height,
      shape.content.length
    )
  }

  // Update text rendering to always be centered
  const textStyles = {
    fontFamily: shape.style.fontFamily,
    fontSize: getFontSize(),
    fontWeight: shape.style.isBold ? 'bold' : 'normal',
    fontStyle: shape.style.isItalic ? 'italic' : 'normal',
    color: shape.style.textColor,
  };

  return (
    <>
      {/* Style toolbar */}
      {isSelected && !isEditing && !isDragging && !isResizing && (
        <StyleToolbar
          style={shape.style}
          onStyleChange={onStyleChange}
          position={getToolbarPosition()}
          shapeColor={shape.color}
          onShapeColorChange={(color) => onShapeColorChange(id, color)}
        />
      )}

      <div
        ref={containerRef}
        data-interactive="true"
        className={cn(
          "absolute", 
          isSelected ? "cursor-default" : "cursor-pointer",
          isDragging && "cursor-grabbing",
          isResizing && `cursor-${resizeHandle}-resize`
        )}
        style={{
          left: `${shape.position.x}px`,
          top: `${shape.position.y}px`,
          width: `${shape.size.width}px`,
          height: `${shape.size.height}px`,
          zIndex: isSelected ? 10 : 1,
          pointerEvents: 'auto'
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
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
        <div className="absolute inset-0">
          {isEditing && shape.type !== 'arrow' ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent resize-none outline-none border-none text-center"
              style={{
                ...textStyles,
                ...getShapePadding(shape.type)
              }}
              placeholder="Add text"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-center"
              style={{
                ...textStyles,
                ...getShapePadding(shape.type),
                visibility: shape.type === 'arrow' ? 'hidden' : 'visible'
              }}
            >
              {shape.type !== 'arrow' && (shape.content || (isSelected ? "Double-click to add text" : ""))}
            </div>
          )}
        </div>

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