"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemType?: string
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemType = "item",
}: DeleteConfirmationDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Check if the user has previously chosen to not show the dialog
  useEffect(() => {
    const savedPreference = localStorage.getItem("dontShowDeleteConfirmation")
    if (savedPreference === "true" && isOpen) {
      // Auto-confirm if the user previously chose not to show the dialog
      onConfirm()
      onClose()
    }
  }, [isOpen, onConfirm, onClose])

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem("dontShowDeleteConfirmation", "true")
    }
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-[#111111] border border-[#333333] text-white"
        aria-describedby="delete-confirmation-description"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Confirm Delete</DialogTitle>
          <DialogDescription className="text-gray-300">
            Are you sure you want to delete this {itemType}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              className="border-gray-500 data-[state=checked]:bg-[#7c3aed] data-[state=checked]:border-[#7c3aed]"
              aria-label={`Don't show this confirmation again`}
            />
            <label htmlFor="dontShowAgain" className="text-sm text-gray-300 cursor-pointer">
              Don&apos;t show this confirmation again
            </label>
          </div>
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
