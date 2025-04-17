"use client"
import { useState, useCallback, useRef, useEffect } from "react"

import type React from "react"

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
    | "add_simple_text"
    | "update_simple_text"
    | "delete_simple_text"
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
  }, [selectedNoteId, selectedTextId, selectedSimpleTextId, selectedStrokeId]);

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

  // Effect to handle global clicks for deselection and placement
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Skip if clicking on any interactive element (sticky notes, text, etc.)
      if (target.closest('[data-interactive=true]')) {
        return;
      }
      
      // Only handle clicks directly on the grid background
      if (gridRef.current && target === gridRef.current) {
        // If we're in pointer mode, allow deselection
        if (activeTool === "pointer") {
          handleDeselectAll();
        }
        
        // Handle panning for other cases
        if (event.button === 0 && activeTool !== "move" && !event.altKey) {
          event.preventDefault();
          setIsPanning(true);
          setPanStart({
            x: event.clientX - pan.x,
            y: event.clientY - pan.y,
          });
          if (containerRef.current) {
            containerRef.current.style.cursor = "grabbing";
          }
        }
      }
    };
    
    document.addEventListener('mousedown', handleGlobalClick);
    return () => { document.removeEventListener('mousedown', handleGlobalClick); };
  }, [activeTool, pan.x, pan.y, handleDeselectAll]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      console.log(`[handleCanvasClick] Fired. Active tool: ${activeTool}`);
      
      // Skip if clicking on a sticky note or its children
      const target = e.target as Element;
      const closestNote = target.closest('.sticky-note');
      if (closestNote) return;

      // Handle placement tools
      if (activeTool === "sticky" || activeTool === "text" || activeTool === "typewriter") {
        const event = e as React.MouseEvent;
        const canvasCoords = screenToCanvas(event.clientX, event.clientY);
        
        if (activeTool === "sticky") {
          console.log("[handleCanvasClick] Placing sticky note");
          const newNote: Note = {
            id: `note-${Date.now()}`,
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
            id: `simple-text-${Date.now()}`,
            content: "",
            position: canvasCoords,
            color: "#FFFFFF", // Default white
          };
          addToHistory({
            type: "add_simple_text",
            data: newSimpleText,
            undo: () => setSimpleTexts((prev) => prev.filter((text) => text.id !== newSimpleText.id)),
            redo: () => setSimpleTexts((prev) => [...prev, newSimpleText]),
          });
          setSimpleTexts((prev) => [...prev, newSimpleText]);
          setSelectedSimpleTextId(newSimpleText.id); // Select the new text
          setSelectedTextId(null); // Deselect typewriter text
          setSelectedNoteId(null); // Deselect note
          setSelectedStrokeId(null); // Deselect stroke
          setActiveTool("pointer"); // Default back to pointer tool
          setContainerCursor('default');
        } else if (activeTool === "typewriter") {
          console.log("[handleCanvasClick] Typewriter tool active, attempting to place typewriter text...");
          const newText: TypewriterText = {
            id: `text-${Date.now()}`,
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
          setSelectedTextId(newText.id); // Select the new typewriter text
          setSelectedSimpleTextId(null); // Deselect simple text
          setSelectedNoteId(null); // Deselect note
          setSelectedStrokeId(null); // Deselect stroke
          setActiveTool("pointer"); // Default back to pointer tool
          setContainerCursor('default');
        }
      }
    },
    [activeTool, addToHistory, screenToCanvas]
  );

  const handleToolSelect = useCallback(
    (tool: string | null) => {
      console.log(`[handleToolSelect] Tool selected: ${tool}, current tool: ${activeTool}`);
      
      // If clicking the same tool or switching to pointer, preserve selection
      if (tool === activeTool || tool === "pointer") {
        console.log("[handleToolSelect] Switching to pointer mode, preserving selection");
        setActiveTool("pointer");
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
        return;
      }

      // Only deselect when activating specific tools
      if (tool === "spray" || tool === "move") {
        console.log(`[handleToolSelect] Activating ${tool}, deselecting all`);
        handleDeselectAll();
      }

      // Set the tool
      setActiveTool(tool);

      // Update cursor
      if (containerRef.current) {
        switch (tool) {
          case 'move':
            containerRef.current.style.cursor = 'grab';
            break;
          case 'spray':
            containerRef.current.style.cursor = 'crosshair';
            break;
          default:
            containerRef.current.style.cursor = 'default';
        }
      }
    },
    [activeTool, handleDeselectAll]
  );

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
        if (selectedSimpleTextId) {
          deleteSelectedSimpleText();
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
  }, [selectedSimpleTextId, selectedNoteId, selectedTextId, selectedStrokeId, deleteSelectedStroke])

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
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content: previousContent } : text)))
      },
      redo: () => {
        setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content } : text)))
      },
    });
    setSimpleTexts((prev) => prev.map((text) => (text.id === id ? { ...text, content } : text)));
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
      id: `note-${Date.now()}`,
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
        {/* Sticky Note Preview - Moved outside the transformed container */}
        {activeTool === "sticky" && (
          <StickyNotePreview
            position={canvasToScreen(mousePosition.x, mousePosition.y)}
            zoom={zoom}
          />
        )}

        {/* Simple Text Preview - Moved outside the transformed container */}
        {activeTool === "text" && (
          <SimpleTextPreview
            position={canvasToScreen(mousePosition.x, mousePosition.y)}
            zoom={zoom}
          />
        )}

        {/* Canvas Container - this is the zoomable/pannable area */}
        <div
          className="canvas-container"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            position: "absolute",
          }}
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
            onSelectStroke={handleStrokeSelect}
            selectedStrokeId={selectedStrokeId}
            alwaysSelectable={true}
            stickyToolActive={activeTool === "sticky"}
            deleteStrokeRef={deleteStrokeRef}
            activeTool={activeTool}
            onBackgroundClick={handleDeselectAll}
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
              onSelect={() => {
                setSelectedNoteId(note.id);
                // Also deselect other types when selecting a note
                if (selectedTextId) setSelectedTextId(null);
                if (selectedStrokeId) {
                   setSelectedStrokeId(null);
                   if (handleStrokeSelect) handleStrokeSelect(null);
                }
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

          {/* Render all simple texts */}
          {simpleTexts.map((text) => (
            <SimpleText
              key={text.id}
              id={text.id}
              content={text.content}
              position={text.position}
              color={text.color}
              isSelected={selectedSimpleTextId === text.id}
              onSelect={() => {
                setSelectedSimpleTextId(text.id);
                // Deselect other types
                if (selectedNoteId) setSelectedNoteId(null);
                if (selectedTextId) setSelectedTextId(null);
                if (selectedStrokeId) {
                  setSelectedStrokeId(null);
                  if (handleStrokeSelect) handleStrokeSelect(null);
                }
              }}
              onContentChange={(content) => handleSimpleTextContentChange(text.id, content)}
              onPositionChange={(position) => handleSimpleTextPositionChange(text.id, position)}
              zoom={zoom}
              screenToCanvas={screenToCanvas}
              activeTool={activeTool}
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
              activeTool={activeTool}
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