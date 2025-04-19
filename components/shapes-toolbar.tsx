import React, { useState, useRef, useCallback } from 'react';
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { useClickAway } from "../hooks/use-click-away";
import { ShapeType } from "@/components/shapes-tool";
import { X } from "lucide-react";

interface ShapesToolbarProps {
    selectedShape: ShapeType | null;
    selectedColor: string;
    onShapeSelect: (shape: ShapeType) => void;
    onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<{
    color: string;
    onChange: (color: string) => void;
}> = ({ color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempColor, setTempColor] = useState(color);
    const popoverRef = useRef<HTMLDivElement>(null);
    
    const handleClose = useCallback(() => {
        if (tempColor !== color) {
            console.log('Color picker closed. Final color:', tempColor);
            onChange(tempColor);
        }
        setIsOpen(false);
    }, [tempColor, color, onChange]);

    useClickAway(popoverRef, handleClose);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            handleClose();
        } else {
            setTempColor(color);
            setIsOpen(true);
        }
    };

    const handleColorChange = (newColor: string) => {
        setTempColor(newColor);
        onChange(newColor);
    };

    return (
        <div className="relative">
            <button
                className="w-8 h-8 rounded-md border border-white/20 transition-colors hover:bg-white/10"
                style={{ backgroundColor: color }}
                onClick={handleClick}
            />
            {isOpen && (
                <div 
                    ref={popoverRef}
                    className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-3 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleClose}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-[#1a1a1a] border border-white/20 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
                        aria-label="Close color picker"
                    >
                        <X size={12} />
                    </button>
                    <HexColorPicker 
                        color={tempColor} 
                        onChange={handleColorChange}
                    />
                </div>
            )}
        </div>
    );
};

// Component to render shape icons
const ShapeIcon: React.FC<{ type: ShapeType; className?: string }> = ({ type, className }) => {
  const baseStyle = "stroke-current stroke-1 fill-none";
  const size = "w-5 h-5"; // Consistent size for icons

  switch (type) {
    case "rectangle":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><rect x="2" y="2" width="16" height="16" rx="1" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "circle":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><circle cx="10" cy="10" r="8" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "diamond":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><polygon points="10,1 19,10 10,19 1,10" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "triangle":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><polygon points="10,1 19,19 1,19" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "invertedTriangle":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><polygon points="1,1 19,1 10,19" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "parallelogram":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><polygon points="4,1 19,1 16,19 1,19" className={baseStyle} vectorEffect="non-scaling-stroke" /></svg>;
    case "arrow":
      return <svg viewBox="0 0 20 20" className={cn(size, className)}><path d="M1,10 H15 L12,7 M15,10 L12,13" className={baseStyle} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
    default:
      return null;
  }
};

export function ShapesToolbar({
    selectedShape,
    selectedColor,
    onShapeSelect,
    onColorSelect,
}: ShapesToolbarProps) {
    return (
        <div className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg border border-white/10">
            <ColorPicker color={selectedColor} onChange={onColorSelect} />
            <div className="h-6 w-px bg-white/20" /> {/* Divider */}
            <div className="flex items-center gap-2">
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "rectangle" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("rectangle")}
                >
                    <ShapeIcon type="rectangle" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "circle" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("circle")}
                >
                    <ShapeIcon type="circle" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "triangle" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("triangle")}
                >
                    <ShapeIcon type="triangle" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "diamond" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("diamond")}
                >
                    <ShapeIcon type="diamond" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "invertedTriangle" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("invertedTriangle")}
                >
                    <ShapeIcon type="invertedTriangle" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "parallelogram" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("parallelogram")}
                >
                    <ShapeIcon type="parallelogram" />
                </button>
                <button
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors text-white",
                        selectedShape === "arrow" ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => onShapeSelect("arrow")}
                >
                    <ShapeIcon type="arrow" />
                </button>
            </div>
        </div>
    );
} 