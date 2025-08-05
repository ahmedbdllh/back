"use client"

import { cn } from "../../../lib/utils"
import { handleImageError } from "../../utils/imageUtils"

export const Avatar = ({ src, alt, className, size = "md", ...props }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden",
      sizeClasses[size],
      className
    )} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || "User avatar"}
          className={cn("object-cover w-full h-full", sizeClasses[size])}
          onError={(e) => handleImageError(e, 'user', alt || 'User')}
        />
      ) : (
        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
          <span className="text-gray-500 text-xs">{alt?.charAt(0) || "U"}</span>
        </div>
      )}
    </div>
  )
}