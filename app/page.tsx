"use client"
import { useState, useCallback, useRef, useEffect } from "react"

import type React from "react"

import { TopNavigation } from "@/components/top-navigation"
import { BottomToolbar } from "@/components/bottom-toolbar"
import { StickyNote } from "@/components/sticky-note"
import { EnhancedPaint } from "@/components/enhanced-paint"
import { TypewriterTool } from "@/components/typewriter-tool"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define the sticky note type
interface Note {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
}

// Define the typewriter text type
interface TypewriterText {
  id: string
  content: string
  position: { x: number; y: number }
  fontSize: number
  color: string
}

// Define the history action type
type HistoryAction = {
  type:
    | "add_note"
    | "update_note"
    | "delete_note"
    | "add_text"
    | "update_text"
    | "delete_text"
    | "add_stroke"
    | "delete_stroke"
  data: any
  undo: () => void
  redo: () => void
}

// Canvas size (much larger than viewport)
const CANVAS_WIDTH = 10000
const CANVAS_HEIGHT = 10000

export default function WhiteboardApp() {
  // State for the active tool
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // State for sticky notes
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  // References
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Add a ref to store the clear canvas function
  const clearCanvasRef = useRef<(() => void) | null>(null)

  // Add a ref to store the delete stroke function
  const deleteStrokeRef = useRef<((id: string) => void) | null>(null)

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

      const rect = containerRef.current.getBoundingClientRect()
      const x = (screenX - rect.left - pan.x) / zoom
      const y = (screenY - rect.top - pan.y) / zoom

      return { x, y }
    },
    [pan, zoom],
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
  const handleWheel = (e: React.WheelEvent) => {
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
  }

  // Start panning with space + drag or middle mouse button
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button (button 1) or space key is pressed
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      })

      // Change cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }
    }
  }

  // Stop panning
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)

      // Reset cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
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

  // Handle canvas click to add a new note when sticky tool is active or deselect notes
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't handle click if we're panning
    if (isPanning) return

    // Get the target element
    const target = e.target as HTMLElement

    // Only process clicks directly on the canvas background (not on notes or other elements)
    // This ensures we're only handling clicks on the empty canvas area
    if (target === canvasRef.current || target === gridRef.current) {
      // Always deselect any selected note when clicking on the canvas
      if (selectedNoteId) {
        setSelectedNoteId(null)
      }

      // Deselect any selected text
      if (selectedTextId) {
        setSelectedTextId(null)
      }

      // Deselect any selected stroke
      if (selectedStrokeId) {
        setSelectedStrokeId(null)
        if (handleStrokeClick) {
          handleStrokeClick(null)
        }
      }

      // Get the position in canvas coordinates
      const canvasCoords = screenToCanvas(e.clientX, e.clientY)

      // Only add a note if the sticky tool is active
      if (activeTool === "sticky") {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          content: "",
          position: {
            x: canvasCoords.x - 110, // Center horizontally (half of 220px width)
            y: canvasCoords.y - 110, // Center vertically (half of 220px height)
          },
          color: "#121212", // Pure black sticky note
        }

        // Add to history before updating state
        addToHistory({
          type: "add_note",
          data: newNote,
          undo: () => {
            setNotes((prev) => prev.filter((note) => note.id !== newNote.id))
          },
          redo: () => {
            setNotes((prev) => [...prev, newNote])
          },
        })

        setNotes((prevNotes) => [...prevNotes, newNote])
        setSelectedNoteId(newNote.id)
        setActiveTool(null) // Deactivate the tool after placing a note
      }

      // Add text if typewriter tool is active
      else if (activeTool === "typewriter" || activeTool === "text") {
        const newText: TypewriterText = {
          id: `text-${Date.now()}`,
          content: "",
          position: canvasCoords,
          fontSize: 16,
          color: "#ffffff", // Default white text
        }

        // Add to history before updating state
        addToHistory({
          type: "add_text",
          data: newText,
          undo: () => {
            setTexts((prev) => prev.filter((text) => text.id !== newText.id))
          },
          redo: () => {
            setTexts((prev) => [...prev, newText])
          },
        })

        setTexts((prevTexts) => [...prevTexts, newText])
        setSelectedTextId(newText.id)
        setActiveTool(null) // Deactivate the tool after placing text
      }
    }
  }

  // Add a new function to handle stroke clicks separately
  const handleStrokeClick = useCallback(
    (id: string | null) => {
      // Only handle stroke selection if we're not in sticky note placement mode
      if (activeTool !== "sticky" && activeTool !== "typewriter") {
        setSelectedStrokeId(id)
      }
    },
    [activeTool],
  )

  // Handle tool selection from the toolbar
  const handleToolSelect = useCallback(
    (tool: string | null) => {
      // If selecting the same tool, toggle it off
      if (tool === activeTool) {
        setActiveTool(null)
        return
      }

      if (tool === "spray") {
        // Activate spray tool and keep the current color
        setActiveTool("spray")
      } else if (tool === "pointer") {
        // When pointer tool is chosen, deactivate any active tool
        setActiveTool(null)
      } else if (tool === "text" || tool === "typewriter") {
        // Both text and typewriter tools should activate the typewriter functionality
        setActiveTool("typewriter")
      } else {
        setActiveTool(tool)
      }

      // Deselect the current note when switching to a tool
      if (tool) {
        setSelectedNoteId(null)
        setSelectedTextId(null)
      }
    },
    [activeTool],
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
      // Only trigger delete if we're not editing text in a textarea or input
      const isEditingText = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT"
      
      if ((e.key === "Delete" || e.key === "Backspace") && !isEditingText) {
        if (selectedNoteId) {
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
  }, [selectedNoteId, selectedTextId, selectedStrokeId, deleteSelectedStroke])

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
          containerRef.current.style.cursor = "default"
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

  // Handle stroke selection
  const handleStrokeSelect = useCallback((id: string | null) => {
    setSelectedStrokeId(id)
  }, [])

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
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas Container - this is the zoomable/pannable area */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            position: "absolute",
          }}
        >
          {/* Dotted Grid Background - FigJam style with small grey dots on black */}
          <div
            ref={gridRef}
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundColor: "#000000",
              backgroundImage: `radial-gradient(#222222 1px, transparent 1px)`,
              backgroundSize: `20px 20px`,
              zIndex: 1,
            }}
            onClick={handleCanvasClick}
          ></div>

          {/* Enhanced Paint Canvas */}
          <EnhancedPaint
            color={sprayColor}
            isActive={activeTool === "spray"}
            zoom={zoom}
            pan={pan}
            screenToCanvas={screenToCanvas}
            brushSize={brushSize}
            onClearRef={clearCanvasRef}
            onSelectStroke={handleStrokeClick}
            selectedStrokeId={selectedStrokeId}
            alwaysSelectable={true}
            stickyToolActive={activeTool === "sticky"} // Disable paint interaction when sticky tool is active
            deleteStrokeRef={deleteStrokeRef} // Pass the delete stroke ref
          />

          {/* Render all sticky notes */}
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              id={note.id}
              content={note.content}
              position={note.position}
              color={note.color}
              isSelected={selectedNoteId === note.id}
              onSelect={() => setSelectedNoteId(note.id)}
              onContentChange={(content) => handleNoteContentChange(note.id, content)}
              onPositionChange={(position) => handleNotePositionChange(note.id, position)}
              zoom={zoom}
              screenToCanvas={screenToCanvas}
            />
          ))}

          {/* Render all typewriter texts */}
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
            />
          ))}
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
      </main>
    </div>
  )
}
