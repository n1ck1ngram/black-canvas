import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Type
} from 'lucide-react';

interface TextOptionsToolbarProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  alignment: 'left' | 'center' | 'right';
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
  isBold: boolean;
  onBoldChange: (bold: boolean) => void;
  isItalic: boolean;
  onItalicChange: (italic: boolean) => void;
  color: string;
  onColorChange: (color: string) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
}

// Color options for the color picker
const colorOptions = [
  // Top row (10 colors)
  { name: "Orange", value: "#FF6B4B" },
  { name: "Light Orange", value: "#FFA04B" },
  { name: "Yellow", value: "#FFD84B" },
  { name: "Green", value: "#4BFF7B" },
  { name: "Turquoise", value: "#4BFFD8" },
  { name: "Blue", value: "#4B9FFF" },
  { name: "Purple", value: "#9F4BFF" },
  { name: "Pink", value: "#FF4B9F" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#666666" },
  // Bottom row (9 colors + picker)
  { name: "Light Pink", value: "#FFB6B6" },
  { name: "Light Peach", value: "#FFD6B6" },
  { name: "Light Yellow", value: "#FFF6B6" },
  { name: "Light Green", value: "#B6FFB6" },
  { name: "Light Turquoise", value: "#B6FFF6" },
  { name: "Light Blue", value: "#B6D6FF" },
  { name: "Light Purple", value: "#D6B6FF" },
  { name: "Light Pink", value: "#FFB6D6" },
  { name: "Dark Gray", value: "#CCCCCC" },
  { name: "Color Picker", value: "picker" }
];

export function TextOptionsToolbar({
  fontSize,
  onFontSizeChange,
  alignment,
  onAlignmentChange,
  isBold,
  onBoldChange,
  isItalic,
  onItalicChange,
  color,
  onColorChange,
  fontFamily,
  onFontFamilyChange,
}: TextOptionsToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.color-picker-popup') && !target.closest('.color-button')) {
        setShowColorPicker(false);
        setShowCustomColorPicker(false);
      }
    };

    if (showColorPicker || showCustomColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showCustomColorPicker]);

  return (
    <div className="absolute -top-14 left-0 flex items-center gap-1 bg-[#222222] rounded-lg border border-[#333333] p-1.5 shadow-lg">
      {/* Font Family */}
      <select
        value={fontFamily}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        className="bg-[#2a2a2a] text-white border border-[#333333] rounded px-2 py-1 text-sm"
      >
        <option value="ui-sans-serif, system-ui, sans-serif">Sans</option>
        <option value="ui-serif, Georgia, serif">Serif</option>
        <option value="ui-monospace, monospace">Mono</option>
      </select>

      {/* Font Size */}
      <select
        value={fontSize}
        onChange={(e) => onFontSizeChange(Number(e.target.value))}
        className="bg-[#2a2a2a] text-white border border-[#333333] rounded px-2 py-1 text-sm"
      >
        <option value="12">Small</option>
        <option value="16">Medium</option>
        <option value="20">Large</option>
        <option value="24">XLarge</option>
      </select>

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5 bg-[#2a2a2a] rounded-md p-1">
        <button
          onClick={() => onAlignmentChange('left')}
          className={cn(
            "p-1 rounded hover:bg-[#333333]",
            alignment === 'left' && "bg-[#333333]"
          )}
        >
          <AlignLeft className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => onAlignmentChange('center')}
          className={cn(
            "p-1 rounded hover:bg-[#333333]",
            alignment === 'center' && "bg-[#333333]"
          )}
        >
          <AlignCenter className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => onAlignmentChange('right')}
          className={cn(
            "p-1 rounded hover:bg-[#333333]",
            alignment === 'right' && "bg-[#333333]"
          )}
        >
          <AlignRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Bold & Italic */}
      <button
        onClick={() => onBoldChange(!isBold)}
        className={cn(
          "p-1.5 rounded hover:bg-[#333333]",
          isBold && "bg-[#333333]"
        )}
      >
        <Bold className="w-4 h-4 text-gray-400" />
      </button>

      <button
        onClick={() => onItalicChange(!isItalic)}
        className={cn(
          "p-1.5 rounded hover:bg-[#333333]",
          isItalic && "bg-[#333333]"
        )}
      >
        <Italic className="w-4 h-4 text-gray-400" />
      </button>

      {/* Color Picker */}
      <div className="relative">
        <button
          ref={colorButtonRef}
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={cn(
            "p-1.5 rounded hover:bg-[#333333] color-button",
            showColorPicker && "bg-[#333333]"
          )}
        >
          <div 
            className="w-4 h-4 rounded-full border border-[#444444]"
            style={{ backgroundColor: color }}
          />
        </button>

        {/* Color Palette Popup */}
        {showColorPicker && (
          <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-[#2a2a2a] rounded-lg border border-[#333333] shadow-lg p-2 z-50 color-picker-popup">
            <div className="flex flex-col gap-1">
              {/* Top row */}
              <div className="flex items-center gap-1">
                {colorOptions.slice(0, 10).map((colorOption) => (
                  <button
                    key={colorOption.value}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-150",
                      color === colorOption.value && "ring-1 ring-[#4B9FFF]"
                    )}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => {
                      onColorChange(colorOption.value);
                      setShowColorPicker(false);
                    }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              
              {/* Bottom row */}
              <div className="flex items-center gap-1">
                {colorOptions.slice(10).map((colorOption) => (
                  <button
                    key={colorOption.value}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all duration-150",
                      color === colorOption.value && "ring-1 ring-[#4B9FFF]",
                      colorOption.value === "picker" && "bg-gradient-to-r from-[#FF0000] via-[#00FF00] to-[#0000FF]"
                    )}
                    style={{
                      backgroundColor: colorOption.value !== "picker" ? colorOption.value : undefined
                    }}
                    onClick={() => {
                      if (colorOption.value === "picker") {
                        setShowCustomColorPicker(true);
                      } else {
                        onColorChange(colorOption.value);
                        setShowColorPicker(false);
                      }
                    }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom Color Picker */}
        {showCustomColorPicker && (
          <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-[#2a2a2a] rounded-lg border border-[#333333] shadow-lg overflow-hidden z-50 color-picker-popup">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                onColorChange(e.target.value);
                setShowCustomColorPicker(false);
                setShowColorPicker(false);
              }}
              className="w-[200px] h-[200px] cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
} 