"use client"

import React, { useState, useEffect, useRef } from 'react';
import { TextOptionsToolbar } from './text-options-toolbar';
import { cn } from "@/lib/utils";

interface SimpleTextProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  color?: string;
  isSelected: boolean;
  onSelect: () => void;
  onContentChange: (content: string) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onStyleChange?: (style: Partial<TextStyle>) => void;
  zoom?: number;
  screenToCanvas?: (screenX: number, screenY: number) => { x: number; y: number };
  activeTool?: string | null;
  style?: TextStyle;
}

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  isBold: boolean;
  isItalic: boolean;
  color: string;
}

const defaultStyle: TextStyle = {
  fontSize: 16,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  alignment: 'left',
  isBold: false,
  isItalic: false,
  color: '#FFFFFF'
};

export function SimpleText({
  id,
  content,
  position,
  isSelected,
  onSelect,
  onContentChange,
  onPositionChange,
  onStyleChange,
  zoom = 1,
  screenToCanvas = (x, y) => ({ x, y }),
  activeTool = null,
  style: propStyle,
}: SimpleTextProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' });
  const [isEditing, setIsEditing] = useState(false);
  const [style, setStyle] = useState<TextStyle>({ ...defaultStyle, ...propStyle });
  const textRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  // Auto-enter edit mode when first created and selected
  useEffect(() => {
    if (isSelected && content === "") {
      setIsEditing(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [isSelected, content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    if (activeTool === "move") {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();

    if (!isSelected) {
      onSelect();
    }

    if (!isEditing) {
      setIsDragging(true);
      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      setResizeStartPos({
        x: canvasCoords.x - position.x,
        y: canvasCoords.y - position.y
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      setIsEditing(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      const newPosition = {
        x: canvasCoords.x - resizeStartPos.x,
        y: canvasCoords.y - resizeStartPos.y,
      };

      onPositionChange(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, resizeStartPos, onPositionChange, screenToCanvas]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && textRef.current && !textRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleStyleChange = (updates: Partial<TextStyle>) => {
    const newStyle = { ...style, ...updates };
    setStyle(newStyle);
    onStyleChange?.(newStyle);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle resize
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing || !textRef.current) return;

      const dx = e.clientX - resizeStartPos.x;
      const dy = e.clientY - resizeStartPos.y;

      const currentWidth = textRef.current.offsetWidth;
      const currentHeight = textRef.current.offsetHeight;

      // Calculate new dimensions
      const newWidth = Math.max(50, currentWidth + dx);
      const newHeight = Math.max(30, currentHeight + dy);

      setDimensions({
        width: newWidth + 'px',
        height: newHeight + 'px'
      });

      // Update resize start position
      setResizeStartPos({
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeStartPos]);

  // Auto-adjust height when content changes
  useEffect(() => {
    if (textareaRef.current && dimensions.height === 'auto') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, dimensions.height]);

  return (
    <div
      ref={textRef}
      data-interactive="true"
      className={cn(
        "absolute inline-block",
        activeTool === 'move' ? "pointer-events-none" :
          isDragging ? "cursor-grabbing" : isEditing ? "cursor-text" : "cursor-grab"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isSelected ? 10 : 1,
        width: dimensions.width,
        height: dimensions.height,
        minHeight: style.fontSize * 1.2 + 'px', // Ensure minimum height based on font size
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && !isDragging && (
        <>
          <TextOptionsToolbar
            fontSize={style.fontSize}
            onFontSizeChange={(size) => {
              handleStyleChange({ fontSize: size });
              // Reset height to auto when font size changes
              setDimensions(prev => ({ ...prev, height: 'auto' }));
            }}
            alignment={style.alignment}
            onAlignmentChange={(alignment) => handleStyleChange({ alignment })}
            isBold={style.isBold}
            onBoldChange={(isBold) => handleStyleChange({ isBold })}
            isItalic={style.isItalic}
            onItalicChange={(isItalic) => handleStyleChange({ isItalic })}
            color={style.color}
            onColorChange={(color) => handleStyleChange({ color })}
            fontFamily={style.fontFamily}
            onFontFamilyChange={(fontFamily) => handleStyleChange({ fontFamily })}
          />
          
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
            style={{
              transform: 'translate(50%, 50%)',
            }}
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-50 w-2 h-2" />
          </div>
        </>
      )}

      <div
        className={cn(
          "relative transition-shadow duration-200 p-1 w-full h-full",
          isDragging ? "shadow-lg" : "shadow-md",
          isSelected && "ring-1 ring-blue-500"
        )}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              onContentChange(e.target.value);
              // Reset height to auto when content changes
              if (dimensions.height === 'auto') {
                setDimensions(prev => ({ ...prev, height: 'auto' }));
              }
            }}
            className="bg-transparent text-current resize-none outline-none m-0 p-0 w-full h-full"
            placeholder="Type something..."
            style={{
              fontFamily: style.fontFamily,
              fontSize: `${style.fontSize}px`,
              fontWeight: style.isBold ? 'bold' : 'normal',
              fontStyle: style.isItalic ? 'italic' : 'normal',
              color: style.color,
              textAlign: style.alignment,
              display: 'block',
              overflow: 'auto',
              lineHeight: '1.2',
            }}
          />
        ) : (
          <div
            className="whitespace-pre-wrap break-words w-full h-full overflow-auto"
            style={{
              fontFamily: style.fontFamily,
              fontSize: `${style.fontSize}px`,
              fontWeight: style.isBold ? 'bold' : 'normal',
              fontStyle: style.isItalic ? 'italic' : 'normal',
              color: style.color,
              textAlign: style.alignment,
              lineHeight: '1.2',
            }}
          >
            {content || "Type something..."}
          </div>
        )}
      </div>
    </div>
  );
} 