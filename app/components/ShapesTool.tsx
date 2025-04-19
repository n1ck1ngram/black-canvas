import { Shape, Position, ShapeStyle, Size } from '../types'
import ColorPicker from './ColorPicker'

interface ShapesToolProps {
  id: string
  shape: Shape
  isSelected: boolean
  onSelect: () => void
  onContentChange: (content: string) => void
  onPositionChange: (position: Position) => void
  onStyleChange: (style: ShapeStyle) => void
  onSizeChange: (size: Size) => void
  onShapeColorChange: (id: string, color: string) => void
  zoom: number
  screenToCanvas: (point: Position) => Position
  activeTool: string
}

export default function ShapesTool({
  id,
  shape,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  onStyleChange,
  onSizeChange,
  onShapeColorChange,
  zoom,
  screenToCanvas,
  activeTool
}: ShapesToolProps) {
  return (
    <div>
      {/* Color Picker */}
      <ColorPicker
        color={shape.color}
        onChange={(color: string) => onShapeColorChange(id, color)}
        buttonClassName="w-6 h-6 rounded-full border border-gray-300"
        popoverClassName="absolute left-0 top-8 z-50"
      />
    </div>
  )
} 