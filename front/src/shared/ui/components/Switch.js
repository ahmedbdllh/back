"use client"

import { useState, useEffect } from "react"
import { cn } from "../../../lib/utils"

export const Switch = ({ checked, onChange, className, disabled = false }) => {
  const [isChecked, setIsChecked] = useState(checked || false)

  // Update internal state when checked prop changes
  useEffect(() => {
    setIsChecked(checked || false)
  }, [checked])

  const handleChange = () => {
    if (disabled) return
    const newValue = !isChecked
    setIsChecked(newValue)
    if (onChange) onChange(newValue)
  }

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500",
        isChecked ? "bg-sky-600" : "bg-gray-200",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
      onClick={handleChange}
      disabled={disabled}
      aria-pressed={isChecked}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          isChecked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  )
}