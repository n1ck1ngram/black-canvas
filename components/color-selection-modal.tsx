"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ColorSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
}

export function ColorSelectionModal({ isOpen, onClose, onColorSelect }: ColorSelectionModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>("white")

  const colors = [
    { name: "White", value: "#ffffff" },
    { name: "Grey", value: "#9ca3af" },
    { name: "Neon Orange", value: "#ff6b00" },
  ]

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onColorSelect(color)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-[#111111] border border-[#333333] text-white"
        style={{
          animation: isOpen ? "dialogFadeIn 0.2s ease-out forwards" : "none",
        }}
      >
        <style jsx global>{`
          @keyframes dialogFadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}</style>
        <DialogHeader>
          <DialogTitle className="text-white">Select Spray Paint Color</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {colors.map((color) => (
            <button
              key={color.value}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border border-[#333333] hover:bg-[#1a1a1a] transition-colors",
                selectedColor === color.value && "ring-2 ring-[#7c3aed] bg-[#1a1a1a]",
              )}
              onClick={() => handleColorSelect(color.value)}
            >
              <div
                className="w-12 h-12 rounded-full border border-[#333333]"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm">{color.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
