"use client"

import { useState } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import Image from "next/image"

interface TopNavigationProps {
  zoom: number
  setZoom: (zoom: number) => void
  resetView: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export function TopNavigation({
  zoom,
  setZoom,
  resetView,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: TopNavigationProps) {
  const [timerValue, setTimerValue] = useState("13:00")

  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 5))
  }

  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.25))
  }

  return (
    <div className="fixed top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
      {/* Left side - Project title and undo/redo buttons */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] rounded-md border border-[#333333] text-gray-200 hover:bg-[#2a2a2a]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium">Project 1</span>
        </button>

        {/* Undo/Redo buttons */}
        <div className="flex items-center ml-2">
          <button
            className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-md disabled:opacity-40"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 14L4 9L9 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 9H15C18.3137 9 21 11.6863 21 15C21 18.3137 18.3137 21 15 21H8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-md disabled:opacity-40"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 14L20 9L15 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 9H9C5.68629 9 3 11.6863 3 15C3 18.3137 5.68629 21 9 21H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Center - Zoom Controls */}
      <div className="flex items-center gap-2 bg-[#222222] rounded-lg border border-[#333333] p-1">
        <button
          className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-md"
          onClick={zoomOut}
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>

        <div className="px-2 text-sm text-gray-300 min-w-[60px] text-center">{Math.round(zoom * 100)}%</div>

        <button
          className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-md"
          onClick={zoomIn}
          title="Zoom In"
        >
          <Plus size={16} />
        </button>

        <button
          className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-md ml-1"
          onClick={resetView}
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center w-10 h-10 bg-[#222222] rounded-md border border-[#333333] overflow-hidden hover:bg-[#2a2a2a]">
          <Image src="/images/avatar.png" alt="User Avatar" width={40} height={40} className="object-cover" />
        </button>

        <button className="flex items-center gap-2 px-3 py-2 bg-[#222222] rounded-md border border-[#333333] text-gray-200 hover:bg-[#2a2a2a]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium">{timerValue}</span>
        </button>

        <button className="flex items-center justify-center w-10 h-10 bg-[#222222] rounded-md border border-[#333333] text-gray-200 hover:bg-[#2a2a2a]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>

        <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-md px-6 py-2">Share</button>
      </div>
    </div>
  )
}
