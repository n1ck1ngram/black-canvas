"use client"
import { useState, useCallback, useRef, useEffect, Fragment } from "react"
import type { ReactElement } from "react"

import { TopNavigation } from "@/components/top-navigation"
import { BottomToolbar } from "@/components/bottom-toolbar"
import { StickyNote } from "@/components/sticky-note"
import { EnhancedPaint } from "@/components/enhanced-paint"
import { TypewriterTool } from "@/components/typewriter-tool"
import { SimpleText } from "@/components/simple-text"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StickyNotePreview } from "@/components/sticky-note-preview"
import { SimpleTextPreview } from "@/components/simple-text-preview"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ShapesTool, ShapeType } from "@/components/shapes-tool"
import { ShapesPreview } from "@/components/shapes-preview"
import { ShapesToolbar } from "@/components/shapes-toolbar"

// Define the sticky note type
interface Note {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
}

// Define the simple text type
interface SimpleTextType {
  id: string
  content: string
  position: { x: number; y: number }
  style: {
    fontSize: number
    fontFamily: string
    alignment: 'left' | 'center' | 'right'
    isBold: boolean
    isItalic: boolean
    color: string
  }
}

// Define the typewriter text type
interface TypewriterText {
  id: string
  content: string
  position: { x: number; y: number }
  fontSize: number
  color: string
}

// Define the shape type
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

// Define the history action type
type HistoryAction = {
  type:
    | "add_note"
    | "update_note"
    | "delete_note"
    | "add_simple_text"
    | "update_simple_text"
    | "delete_simple_text"
    | "add_text"
    | "update_text"
    | "delete_text"
    | "add_stroke"
    | "delete_stroke"
    | "add_shape"
    | "update_shape"
    | "delete_shape"
  data: any
  undo: () => void
  redo: () => void
}

// Canvas size (much larger than viewport)
const CANVAS_WIDTH = 10000
const CANVAS_HEIGHT = 10000

// Add a stable ID generator function at the top level
function generateStableId(prefix: string) {
  // Use a combination of prefix and random string that will be stable between server and client
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`
}

// Add type for preview components
const renderPreviews = (
  activeTool: string | null,
  mousePosition: { x: number; y: number },
  canvasToScreen: (x: number, y: number) => { x: number; y: number },
  zoom: number,
  selectedShapeType: ShapeType | null,
  shapeColor: string
): React.ReactElement => {
  const screenPosition = canvasToScreen(mousePosition.x, mousePosition.y);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
      {activeTool === "sticky" && (
        <StickyNotePreview
          key="sticky-preview"
          position={screenPosition}
          zoom={zoom}
        />
      )}

      {activeTool === "text" && (
        <SimpleTextPreview
          key="text-preview"
          position={screenPosition}
          zoom={zoom}
        />
      )}

      {activeTool === "shapes" && selectedShapeType !== null && (
        <ShapesPreview
          key="shape-preview"
          position={screenPosition}
          zoom={zoom}
          shapeType={selectedShapeType}
          color={shapeColor}
        />
      )}
    </div>
  );
};

export default function WhiteboardApp() {
  // State for the active tool
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // State for sticky notes
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // State for simple texts
  const [simpleTexts, setSimpleTexts] = useState<SimpleTextType[]>([])
  const [selectedSimpleTextId, setSelectedSimpleTextId] = useState<string | null>(null)

  // State for typewriter texts
  const [texts, setTexts] = useState<TypewriterText[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

  // State for spray paint
  const [sprayColor, setSprayColor] = useState("#7ab2ff") // Default blue color
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null)

  // State for mouse position (for preview)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // State for zoom and pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 })

  // State for undo/redo history
  const [history, setHistory] = useState<HistoryAction[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [strokes, setStrokes] = useState<any[]>([]) // Store strokes for undo/redo

  // Add state for shapes
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType | null>(null)
  const [shapeColor, setShapeColor] = useState<string>("#FFFFFF") // Changed from #4B9FFF to #FFFFFF

  // References
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Add a ref to store the clear canvas function
  const clearCanvasRef = useRef<(() => void) | null>(null)

  // Add a ref to store the delete stroke function
  const deleteStrokeRef = useRef<((id: string) => void) | null>(null)

  // Handles selecting/deselecting strokes
  const handleStrokeSelect = useCallback(
    (id: string | null) => {
      console.log(`[handleStrokeSelect] Setting selected stroke ID: ${id}`)
      setSelectedStrokeId(id)
      if (id) {
        setSelectedNoteId(null)
        setSelectedTextId(null)
        setSelectedSimpleTextId(null)
      }
    },
    [setSelectedStrokeId, setSelectedNoteId, setSelectedTextId, setSelectedSimpleTextId],
  )

  // Callback to deselect all element types
  const handleDeselectAll = useCallback(() => {
    console.log("[handleDeselectAll] Deselecting all elements.");
    if (selectedNoteId) setSelectedNoteId(null);
    if (selectedTextId) setSelectedTextId(null);
    if (selectedSimpleTextId) setSelectedSimpleTextId(null);
    if (selectedStrokeId) {
      setSelectedStrokeId(null);
      handleStrokeSelect(null); // Ensure EnhancedPaint knows
    }
    if (selectedShapeId) setSelectedShapeId(null)
  }, [selectedNoteId, selectedTextId, selectedSimpleTextId, selectedStrokeId, selectedShapeId]);

  // Initialize view to center of canvas
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setViewportCenter({
        x: width / 2,
        y: height / 2,
      })

      // Center the canvas initially
      setPan({
        x: (width - CANVAS_WIDTH) / 2,
        y: (height - CANVAS_HEIGHT) / 2,
      })
    }
  }, [])

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 }

      // If hand tool is active, prevent default cursor logic
      if (activeTool === 'move') {
        // The container itself should have grab/grabbing cursor
      } else if (activeTool === 'spray') {
        // Spray tool manages its own cursor via EnhancedPaint
      } else {
        // Default cursor for other states (e.g., pointer)
        containerRef.current.style.cursor = "default";
      }

      const rect = containerRef.current.getBoundingClientRect()
      const x = (screenX - rect.left - pan.x) / zoom
      const y = (screenY - rect.top - pan.y) / zoom

      return { x, y }
    },
    [pan, zoom, activeTool],
  )

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 }

      const x = canvasX * zoom + pan.x
      const y = canvasY * zoom + pan.y

      return { x, y }
    },
    [pan, zoom],
  )

  // Handle mouse move for position tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position in canvas coordinates
    const canvasCoords = screenToCanvas(e.clientX, e.clientY)
    setMousePosition(canvasCoords)

    // Handle panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    // Get mouse position before zoom
    const mousePos = screenToCanvas(e.clientX, e.clientY)

    // Calculate new zoom level
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    const newZoom = Math.max(0.25, Math.min(5, zoom + delta))

    // Apply zoom
    setZoom(newZoom)

    // Adjust pan to keep mouse position fixed
    const newMousePos = {
      x: e.clientX - mousePos.x * newZoom,
      y: e.clientY - mousePos.y * newZoom,
    }

    setPan({
      x: newMousePos.x - (e.clientX - pan.x - mousePos.x * zoom),
      y: newMousePos.y - (e.clientY - pan.y - mousePos.y * zoom),
    })
  }, [zoom, pan, screenToCanvas])

  // Add wheel event listener with { passive: false }
  useEffect(() => {
    const mainElement = containerRef.current
    if (!mainElement) return

    mainElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      mainElement.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Start panning with space + drag or middle mouse button / Also handle deselection on container click
  const handleMouseDown = (e: React.MouseEvent) => {
    // Pan if:
    // 1. Middle mouse button (button 1) is pressed
    // 2. Left mouse button (button 0) AND Alt key are pressed
    // 3. Left mouse button (button 0) AND Hand tool is active
    const isPanningTrigger = 
      e.button === 1 || 
      (e.button === 0 && e.altKey) || 
      (e.button === 0 && activeTool === "move");

    if (isPanningTrigger) {
      e.preventDefault()
      e.stopPropagation(); // Stop propagation ONLY if panning starts
      setIsPanning(true)
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      })

      // Change cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }

      // If panning was triggered, DO NOT proceed to deselection logic
      return;
    }

    // If not panning, do nothing here. Let event propagate.
  }

  // Helper to set cursor, considering spray paint's custom cursor
  const setContainerCursor = (cursorStyle: string) => {
    if (containerRef.current && activeTool !== 'spray') { // Don't interfere if spray is active
      containerRef.current.style.cursor = cursorStyle;
    }
  };

  // Stop panning
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)

      // Reset cursor based on whether move tool is still active
      setContainerCursor(activeTool === 'move' ? 'grab' : 'default');
    }
  }

  // Reset view to center
  const resetView = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setPan({
        x: (width - CANVAS_WIDTH * zoom) / 2,
        y: (height - CANVAS_HEIGHT * zoom) / 2,
      })
    }
    setZoom(1)
  }

  // Add an action to history
  const addToHistory = useCallback(
    (action: HistoryAction) => {
      // If we're not at the end of the history, remove all future actions
      if (historyIndex < history.length - 1) {
        setHistory(history.slice(0, historyIndex + 1))
      }

      // Add the new action and update the index
      setHistory((prev) => [...prev, action])
      setHistoryIndex((prev) => prev + 1)
    },
    [history, historyIndex],
  )

  // Undo the last action
  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      const action = history[historyIndex]
      action.undo()
      setHistoryIndex((prev) => prev - 1)
    }
  }, [history, historyIndex])

  // Redo the last undone action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const action = history[historyIndex + 1]
      action.redo()
      setHistoryIndex((prev) => prev + 1)
    }
  }, [history, historyIndex])

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      // If spray tool is active, let EnhancedPaint handle the event exclusively
      if (activeTool === "spray") {
        return;
      }
      
      const target = e.target as Element;
      const container = (e.currentTarget as Element);
      
      // Only proceed if the click target is the container itself (canvas background)
      // or an element without the data-interactive attribute.
      const closestInteractive = target.closest('[data-interactive="true"]');
      if (closestInteractive) {
        // console.log("[handleCanvasClick] Clicked on an interactive element, stopping.");
        return; // Stop if the click landed on an interactive element
      }
      
      // Log only when a background click intended for placement occurs
      console.log(`[handleCanvasClick] Background clicked. Active tool: ${activeTool}`);

      // Handle placement tools
      if (activeTool === "sticky" || activeTool === "text" || activeTool === "typewriter" || activeTool === "shapes") {
        const event = e as React.MouseEvent;
        const canvasCoords = screenToCanvas(event.clientX, event.clientY);
        
        if (activeTool === "shapes" && selectedShapeType) {
          console.log("[handleCanvasClick] Placing shape:", selectedShapeType);
          const newShape: Shape = {
            id: generateStableId('shape'),
            type: selectedShapeType,
            position: {
              x: canvasCoords.x - 100,
              y: canvasCoords.y - 100,
            },
            size: { width: 200, height: 200 },
            color: shapeColor,
            content: "",
            style: {
              fontSize: 16,
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              alignment: 'center',
              isBold: false,
              isItalic: false,
              textColor: '#FFFFFF'
            }
          };
          
          // Log the new shape data before adding
          console.log("[handleCanvasClick] New shape data:", JSON.stringify(newShape));

          addToHistory({
            type: "add_shape",
            data: newShape,
            undo: () => setShapes((prev) => prev.filter((shape) => shape.id !== newShape.id)),
            redo: () => setShapes((prev) => [...prev, newShape]),
          });

          setShapes((prev) => [...prev, newShape]);
          setSelectedShapeId(newShape.id);
          setSelectedShapeType(null);
          setActiveTool("pointer");
        } else if (activeTool === "sticky") {
          console.log("[handleCanvasClick] Placing sticky note");
          const newNote: Note = {
            id: generateStableId('note'),
            content: "",
            position: {
              x: canvasCoords.x - 110,
              y: canvasCoords.y - 110,
            },
            color: "#121212",
          };
          addToHistory({
            type: "add_note",
            data: newNote,
            undo: () => setNotes((prev) => prev.filter((note) => note.id !== newNote.id)),
            redo: () => setNotes((prev) => [...prev, newNote]),
          });
          setNotes((prevNotes) => [...prevNotes, newNote]);
          setSelectedNoteId(newNote.id);
          setActiveTool("pointer");
        } else if (activeTool === "text") {
          console.log("[handleCanvasClick] Text tool active, attempting to place simple text...");
          const newSimpleText: SimpleTextType = {
            id: generateStableId('simple-text'),
            content: "",
            position: canvasCoords,
            style: {
              fontSize: 16,
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              alignment: 'left',
              isBold: false,
              isItalic: false,
              color: '#FFFFFF'
            }
          };
          addToHistory({
            type: "add_simple_text",
            data: newSimpleText,
            undo: () => setSimpleTexts((prev) => prev.filter((text) => text.id !== newSimpleText.id)),
            redo: () => setSimpleTexts((prev) => [...prev, newSimpleText]),
          });
          setSimpleTexts((prev) => [...prev, newSimpleText]);
          setSelectedSimpleTextId(newSimpleText.id);
          setSelectedTextId(null);
          setSelectedNoteId(null);
          setSelectedStrokeId(null);
          setActiveTool("pointer");
          setContainerCursor('default');
        } else if (activeTool === "typewriter") {
          console.log("[handleCanvasClick] Typewriter tool active, attempting to place typewriter text...");
          const newText: TypewriterText = {
            id: generateStableId('text'),
            content: "",
            position: canvasCoords,
            fontSize: 16,
            color: "#ffffff",
          };
          addToHistory({
            type: "add_text",
            data: newText,
            undo: () => setTexts((prev) => prev.filter((text) => text.id !== newText.id)),
            redo: () => setTexts((prev) => [...prev, newText]),
          });
          setTexts((prevTexts) => [...prevTexts, newText]);
          setSelectedTextId(newText.id);
          setSelectedSimpleTextId(null);
          setSelectedNoteId(null);
          setSelectedStrokeId(null);
          setActiveTool("pointer");
          setContainerCursor('default');
        }
      }
    },
    [activeTool, addToHistory, screenToCanvas, selectedShapeType, shapeColor]
  );

  // Handle tool selection
  const handleToolSelect = useCallback(
    (tool: string | null) => {
      console.log("Tool selected:", tool)
      
      // If switching away from shapes tool, reset the selected shape type
      if (activeTool === "shapes" && tool !== "shapes") {
        setSelectedShapeType(null)
      }
      
      setActiveTool(tool)
      
      // Reset selection states when switching tools
      setSelectedNoteId(null)
      setSelectedTextId(null)
      setSelectedSimpleTextId(null)
      setSelectedStrokeId(null)
      setSelectedShapeId(null)
    },
    [activeTool, setSelectedStrokeId]
  )

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSprayColor(color)
    // Keep the spray tool active after selecting a color
    setActiveTool("spray")
  }

  // Update note content
  const handleNoteContentChange = (id: string, content: string) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id)
    if (!noteToUpdate) return

    // Store the previous content for undo
    const previousContent = noteToUpdate.content

    // Add to history
    addToHistory({
      type: "update_note",
      data: { id, content, previousContent },
      undo: () => {
        setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, content: previousContent } : note)))
      },
      redo: () => {
        setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, content } : note)))
      },
    })

    // Update the note
    setNotes((prevNotes) => prevNotes.map((note) => (note.id === id ? { ...note, content } : note)))
  }

  // Update note position
  const handleNotePositionChange = (id: string, position: { x: number; y: number }) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id)
    if (!noteToUpdate) return

    // Store the previous position for undo
    const previousPosition = noteToUpdate.position

    // Add to history
    addToHistory({
      type: "update_note",
      data: { id, position, previousPosition },
      undo: () => {
        setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, position: previousPosition } : note)))
      },
      redo: () => {
        setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, position } : note)))
      },
    })

    // Update the note
    setNotes((prevNotes) => prevNotes.map((note) => (note.id === id ? { ...note, position } : note)))
  }

  // Update text content
  const handleTextContentChange = (id: string, content: string) => {
    // Find the text to update
    const textToUpdate = texts.find((text) => text.id === id)
    if (!textToUpdate) return

    // Store the previous content for undo
    const previousContent = textToUpdate.content

    // Add to history
    addToHistory({
      type: "update_text",
      data: { id, content, previousContent },
      undo: () => {
        setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content: previousContent } : text)))
      },
      redo: () => {
        setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content } : text)))
      },
    })

    // Update the text
    setTexts((prevTexts) => prevTexts.map((text) => (text.id === id ? { ...text, content } : text)))
  }

  // Update text position
  const handleTextPositionChange = (id: string, position: { x: number; y: number }) => {
    // Find the text to update
    const textToUpdate = texts.find((text) => text.id === id)
    if (!textToUpdate) return

    // Store the previous position for undo
    const previousPosition = textToUpdate.position

    // Add to history
    addToHistory({
      type: "update_text",
      data: { id, position, previousPosition },
      undo: () => {
        setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, position: previousPosition } : text)))
      },
      redo: () => {
        setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, position } : text)))
      },
    })

    // Update the text
    setTexts((prevTexts) => prevTexts.map((text) => (text.id === id ? { ...text, position } : text)))
  }

  // Delete selected note
  const deleteSelectedNote = () => {
    if (selectedNoteId) {
      // Find the note to delete
      const noteToDelete = notes.find((note) => note.id === selectedNoteId)
      if (!noteToDelete) return

      // Add to history
      addToHistory({
        type: "delete_note",
        data: noteToDelete,
        undo: () => {
          setNotes((prev) => [...prev, noteToDelete])
        },
        redo: () => {
          setNotes((prev) => prev.filter((note) => note.id !== noteToDelete.id))
        },
      })

      // Delete the note
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== selectedNoteId))
      setSelectedNoteId(null)
    }
  }

  // Delete selected text
  const deleteSelectedText = () => {
    if (selectedTextId) {
      // Find the text to delete
      const textToDelete = texts.find((text) => text.id === selectedTextId)
      if (!textToDelete) return

      // Add to history
      addToHistory({
        type: "delete_text",
        data: textToDelete,
        undo: () => {
          setTexts((prev) => [...prev, textToDelete])
        },
        redo: () => {
          setTexts((prev) => prev.filter((text) => text.id !== textToDelete.id))
        },
      })

      // Delete the text
      setTexts((prevTexts) => prevTexts.filter((text) => text.id !== selectedTextId))
      setSelectedTextId(null)
    }
  }

  // Update the deleteSelectedStroke function to be more direct
  const deleteSelectedStroke = useCallback(() => {
    if (selectedStrokeId && deleteStrokeRef.current) {
      console.log("Main page calling deleteStroke with ID:", selectedStrokeId)
      deleteStrokeRef.current(selectedStrokeId)
      setSelectedStrokeId(null)
    }
  }, [selectedStrokeId])

  // Handle delete key press for notes, texts, and strokes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditingText = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT"
      
      if ((e.key === "Delete" || e.key === "Backspace") && !isEditingText) {
        if (selectedShapeId) {
          deleteSelectedShape()
        } else if (selectedSimpleTextId) {
          deleteSelectedSimpleText()
        } else if (selectedNoteId) {
          const dontShow = localStorage.getItem("dontShowDeleteConfirmation") === "true"
          if (dontShow) {
            deleteSelectedNote()
          } else {
            setIsDeleteDialogOpen(true)
          }
        } else if (selectedTextId) {
          deleteSelectedText()
        } else if (selectedStrokeId) {
          deleteSelectedStroke()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedShapeId, selectedSimpleTextId, selectedNoteId, selectedTextId, selectedStrokeId, deleteSelectedStroke])

  // Add keyboard event listeners for space bar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        if (containerRef.current) {
          containerRef.current.style.cursor = "grab"
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        if (containerRef.current && !isPanning) {
          // Only reset if move tool isn't active
          setContainerCursor(activeTool === 'move' ? 'grab' : 'default');
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isPanning])

  // Update the clearCanvas function to actually clear the canvas
  const clearCanvas = useCallback(() => {
    // This will be a reference to the clear function in EnhancedPaint
    if (clearCanvasRef.current) {
      clearCanvasRef.current()
    }
  }, [])

  // Add a function to handle brush size changes
  const handleBrushSizeChange = useCallback((size: number) => {
    setBrushSize(size)
  }, [])

  // Update simple text content
  const handleSimpleTextContentChange = (id: string, content: string) => {
    const textToUpdate = simpleTexts.find((text) => text.id === id);
    if (!textToUpdate) return;
    const previousContent = textToUpdate.content;
    addToHistory({
      type: "update_simple_text",
      data: { id, content, previousContent },
      undo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content: previousContent } : text)));
      },
      redo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content } : text)));
      },
    });
    setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content } : text)));
  };

  // Update simple text style
  const handleSimpleTextStyleChange = (id: string, style: Partial<SimpleTextType['style']>) => {
    const textToUpdate = simpleTexts.find((text) => text.id === id);
    if (!textToUpdate) return;
    const previousStyle = textToUpdate.style;
    const newStyle = { ...previousStyle, ...style };
    
    addToHistory({
      type: "update_simple_text",
      data: { id, style: newStyle, previousStyle },
      undo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, style: previousStyle } : text)));
      },
      redo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, style: newStyle } : text)));
      },
    });
    
    setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, style: newStyle } : text)));
  };

  // Update simple text position
  const handleSimpleTextPositionChange = (id: string, position: { x: number; y: number }) => {
    const textToUpdate = simpleTexts.find((text) => text.id === id);
    if (!textToUpdate) return;
    const previousPosition = textToUpdate.position;
    addToHistory({
      type: "update_simple_text",
      data: { id, position, previousPosition },
      undo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, position: previousPosition } : text)))
      },
      redo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, position } : text)))
      },
    });
    setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, position } : text)));
  };

  // Delete selected simple text
  const deleteSelectedSimpleText = () => {
    if (selectedSimpleTextId) {
      const textToDelete = simpleTexts.find((text) => text.id === selectedSimpleTextId);
      if (!textToDelete) return;
      addToHistory({
        type: "delete_simple_text",
        data: textToDelete,
        undo: () => setSimpleTexts((prev) => [...prev, textToDelete]),
        redo: () => setSimpleTexts((prev) => prev.filter((text) => text.id !== textToDelete.id)),
      });
      setSimpleTexts((prev) => prev.filter((text) => text.id !== selectedSimpleTextId));
      setSelectedSimpleTextId(null);
    }
  };

  // Handle adding adjacent sticky notes
  const handleAddAdjacentNote = useCallback((noteId: string, direction: 'top' | 'right' | 'bottom' | 'left') => {
    console.log(`Adding adjacent note in direction: ${direction} for note: ${noteId}`);
    const originalNote = notes.find(note => note.id === noteId);
    if (!originalNote) {
      console.error('Original note not found:', noteId);
      return;
    }

    console.log('Original note position:', originalNote.position);

    const offset = 260; // Note size (220px) + increased gap (40px)
    let newPosition = { ...originalNote.position };
    
    switch (direction) {
      case 'top':
        newPosition.y -= offset;
        break;
      case 'right':
        newPosition.x += offset;
        break;
      case 'bottom':
        newPosition.y += offset;
        break;
      case 'left':
        newPosition.x -= offset;
        break;
    }

    console.log('New note position:', newPosition);

    const newNote: Note = {
      id: generateStableId('note'),
      content: "",
      position: newPosition,
      color: "#121212",
    };

    addToHistory({
      type: "add_note",
      data: newNote,
      undo: () => setNotes(prev => prev.filter(note => note.id !== newNote.id)),
      redo: () => setNotes(prev => [...prev, newNote]),
    });

    setNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
  }, [notes, addToHistory]);

  // Handle shape selection
  const handleShapeSelect = useCallback((type: ShapeType) => {
    console.log("Shape type selected:", type)
    setSelectedShapeType(type)
  }, [])

  // Handle shape color selection
  const handleShapeColorSelect = useCallback((color: string) => {
    console.log("Shape color selected:", color)
    setShapeColor(color)
  }, [])

  // Handle shape content change
  const handleShapeContentChange = (id: string, content: string) => {
    const shapeToUpdate = shapes.find((shape) => shape.id === id)
    if (!shapeToUpdate) return

    const previousContent = shapeToUpdate.content

    addToHistory({
      type: "update_shape",
      data: { id, content, previousContent },
      undo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, content: previousContent } : shape)))
      },
      redo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, content } : shape)))
      },
    })

    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, content } : shape)))
  }

  // Handle shape position change
  const handleShapePositionChange = (id: string, position: { x: number; y: number }) => {
    const shapeToUpdate = shapes.find((shape) => shape.id === id)
    if (!shapeToUpdate) return

    const previousPosition = shapeToUpdate.position

    addToHistory({
      type: "update_shape",
      data: { id, position, previousPosition },
      undo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, position: previousPosition } : shape)))
      },
      redo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, position } : shape)))
      },
    })

    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, position } : shape)))
  }

  // Handle shape style change
  const handleShapeStyleChange = (id: string, style: Partial<Shape['style']>) => {
    const shapeToUpdate = shapes.find((shape) => shape.id === id)
    if (!shapeToUpdate) return

    const previousStyle = shapeToUpdate.style
    const newStyle = { ...previousStyle, ...style }

    addToHistory({
      type: "update_shape",
      data: { id, style: newStyle, previousStyle },
      undo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, style: previousStyle } : shape)))
      },
      redo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, style: newStyle } : shape)))
      },
    })

    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, style: newStyle } : shape)))
  }

  // Add deleteSelectedShape function
  const deleteSelectedShape = () => {
    if (selectedShapeId) {
      const shapeToDelete = shapes.find((shape) => shape.id === selectedShapeId)
      if (!shapeToDelete) return

      addToHistory({
        type: "delete_shape",
        data: shapeToDelete,
        undo: () => setShapes((prev) => [...prev, shapeToDelete]),
        redo: () => setShapes((prev) => prev.filter((shape) => shape.id !== shapeToDelete.id)),
      })

      setShapes((prev) => prev.filter((shape) => shape.id !== selectedShapeId))
      setSelectedShapeId(null)
    }
  }

  // Add handleShapeSizeChange function
  const handleShapeSizeChange = (id: string, size: { width: number; height: number }) => {
    const shapeToUpdate = shapes.find((shape) => shape.id === id)
    if (!shapeToUpdate) return

    const previousSize = shapeToUpdate.size

    addToHistory({
      type: "update_shape",
      data: { id, size, previousSize },
      undo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, size: previousSize } : shape)))
      },
      redo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, size } : shape)))
      },
    })

    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, size } : shape)))
  }

  // Add handleShapeColorChange function
  const handleShapeColorChange = (id: string, color: string) => {
    const shapeToUpdate = shapes.find((shape) => shape.id === id)
    if (!shapeToUpdate) return

    const previousColor = shapeToUpdate.color

    addToHistory({
      type: "update_shape",
      data: { id, color, previousColor },
      undo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, color: previousColor } : shape)))
      },
      redo: () => {
        setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, color } : shape)))
      },
    })

    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, color } : shape)))
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200">
      {/* Top Navigation */}
      <TopNavigation
        zoom={zoom}
        setZoom={setZoom}
        resetView={resetView}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Main Content Area */}
      <main
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas Container - this is the zoomable/pannable area */}
        <div
          className="canvas-container"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            position: "absolute",
            zIndex: 10,
          }}
          onClick={handleCanvasClick}
        >
          {/* Dotted Grid Background */}
          <div
            ref={gridRef}
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundColor: "#000000",
              backgroundImage: `radial-gradient(#222222 1.5px, transparent 1.5px)`,
              backgroundSize: `40px 40px`,
              zIndex: 1,
            }}
          ></div>

          {/* Enhanced Paint Canvas */}
          <div style={{ zIndex: 20 }} className="absolute inset-0"> {/* z-index for paint, removed pointerEvents: 'none' */}
            <EnhancedPaint
              color={sprayColor}
              isActive={activeTool === "spray"}
              zoom={zoom}
              pan={pan}
              screenToCanvas={screenToCanvas}
              brushSize={brushSize}
              onClearRef={clearCanvasRef}
              onSelectStroke={handleStrokeSelect}
              selectedStrokeId={selectedStrokeId}
              alwaysSelectable={true}
              stickyToolActive={activeTool === "sticky"}
              deleteStrokeRef={deleteStrokeRef}
              activeTool={activeTool}
              onBackgroundClick={handleDeselectAll}
            />
          </div>

          {/* Interactive Elements Container */}
          <div className="absolute inset-0" style={{ zIndex: 30, pointerEvents: 'none' }}>
            {/* Sticky Notes */}
            {notes.map((note) => (
              <StickyNote
                key={note.id}
                id={note.id}
                content={note.content}
                position={note.position}
                color={note.color}
                isSelected={selectedNoteId === note.id}
                onSelect={() => {
                  setSelectedNoteId(note.id);
                  setSelectedTextId(null);
                  setSelectedSimpleTextId(null);
                  setSelectedStrokeId(null);
                  if (handleStrokeSelect) handleStrokeSelect(null);
                  setSelectedShapeId(null);
                }}
                onContentChange={(content) => handleNoteContentChange(note.id, content)}
                onPositionChange={(position) => handleNotePositionChange(note.id, position)}
                onDelete={() => {
                  setSelectedNoteId(note.id);
                  const dontShow = localStorage.getItem("dontShowDeleteConfirmation") === "true"
                  if (dontShow) {
                    deleteSelectedNote()
                  } else {
                    setIsDeleteDialogOpen(true)
                  }
                }}
                onAddAdjacent={(direction) => handleAddAdjacentNote(note.id, direction)}
                zoom={zoom}
                screenToCanvas={screenToCanvas}
                activeTool={activeTool}
              />
            ))}

            {/* Simple Texts */}
            {simpleTexts.map((text) => (
              <SimpleText
                key={text.id}
                id={text.id}
                content={text.content}
                position={text.position}
                style={text.style}
                isSelected={selectedSimpleTextId === text.id}
                onSelect={() => {
                  setSelectedSimpleTextId(text.id);
                  setSelectedNoteId(null);
                  setSelectedTextId(null);
                  setSelectedStrokeId(null);
                  if (handleStrokeSelect) handleStrokeSelect(null);
                  setSelectedShapeId(null);
                }}
                onContentChange={(content) => handleSimpleTextContentChange(text.id, content)}
                onPositionChange={(position) => handleSimpleTextPositionChange(text.id, position)}
                onStyleChange={(style) => handleSimpleTextStyleChange(text.id, style)}
                zoom={zoom}
                screenToCanvas={screenToCanvas}
                activeTool={activeTool}
              />
            ))}

            {/* Typewriter Texts */}
            {texts.map((text) => (
              <TypewriterTool
                key={text.id}
                id={text.id}
                content={text.content}
                position={text.position}
                fontSize={text.fontSize}
                color={text.color}
                isSelected={selectedTextId === text.id}
                onSelect={() => setSelectedTextId(text.id)}
                onContentChange={(content) => handleTextContentChange(text.id, content)}
                onPositionChange={(position) => handleTextPositionChange(text.id, position)}
                zoom={zoom}
                screenToCanvas={screenToCanvas}
                activeTool={activeTool}
              />
            ))}

            {/* Shapes */}
            {shapes.map((shape) => (
              <ShapesTool
                key={shape.id}
                id={shape.id}
                shape={shape}
                isSelected={selectedShapeId === shape.id}
                onSelect={() => {
                  setSelectedShapeId(shape.id)
                  if (selectedNoteId) setSelectedNoteId(null)
                  if (selectedTextId) setSelectedTextId(null)
                  if (selectedSimpleTextId) setSelectedSimpleTextId(null)
                  if (selectedStrokeId) {
                    setSelectedStrokeId(null)
                    if (handleStrokeSelect) handleStrokeSelect(null)
                  }
                }}
                onContentChange={(content) => handleShapeContentChange(shape.id, content)}
                onPositionChange={(position) => handleShapePositionChange(shape.id, position)}
                onStyleChange={(style) => handleShapeStyleChange(shape.id, style)}
                onSizeChange={(size) => handleShapeSizeChange(shape.id, size)}
                onShapeColorChange={handleShapeColorChange}
                zoom={zoom}
                screenToCanvas={screenToCanvas}
                activeTool={activeTool}
              />
            ))}
          </div>
        </div>

        {/* Preview Components - Rendered outside the transformed container */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
          {renderPreviews(activeTool, mousePosition, canvasToScreen, zoom, selectedShapeType, shapeColor)}
        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onColorSelect={handleColorSelect}
          selectedColor={sprayColor}
          brushSize={brushSize}
          onBrushSizeChange={handleBrushSizeChange}
        />

        {/* Shapes Toolbar - Positioned at the bottom */}
        {activeTool === "shapes" && (
          <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-50">
            <ShapesToolbar
              onShapeSelect={handleShapeSelect}
              onColorSelect={handleShapeColorSelect}
              selectedShape={selectedShapeType}
              selectedColor={shapeColor}
            />
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteSelectedNote}
        itemType="sticky note"
      />
    </div>
  )
}