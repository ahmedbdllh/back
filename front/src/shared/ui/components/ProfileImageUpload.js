"use client"

import { useState, useRef } from "react"
import { Button } from "./Button"
import { Icons } from "./Icons"
import { Avatar } from "./Avatar"
import { getImageUrl, handleImageError } from "../../../shared/utils/imageUtils"

export const ProfileImageUpload = ({ currentImage, onImageUpdate, className = "" }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('ProfileImageUpload: File selected for upload:', file.name, file.type, `${Math.round(file.size/1024)}KB`);
      handleUpload(file)
    }
  }

  const handleUpload = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or GIF)")
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("profileImage", file)

      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/auth/upload-profile-image", {
        method: "POST",
        headers: {
          "x-auth-token": token,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to upload image")
      }
      
      console.log('ProfileImageUpload: Upload successful, received response:', data);
      console.log('ProfileImageUpload: Image URL from server:', data.imageUrl);

      setSuccess("Profile image updated successfully!")
      
      // Update the user data in localStorage
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      
      // Extract just the filename from the profile image path
      let imageUrl = data.imageUrl;
      if (imageUrl && typeof imageUrl === 'string') {
        // Use the same logic as in imageUtils.js to extract just the filename
        if (imageUrl.includes('\\') || 
            imageUrl.includes('C:') || 
            imageUrl.includes('/uploads/') || 
            imageUrl.includes('profileImage-')) {
          
          const matches = imageUrl.match(/profileImage-[^\\\/]+\.\w+/);
          if (matches && matches[0]) {
            console.log('Extracted filename using regex:', matches[0]);
            imageUrl = '/uploads/' + matches[0];
          } else {
            // Fallback to simpler filename extraction
            const parts = imageUrl.split(/[\/\\]/);
            const filename = parts[parts.length - 1];
            if (filename && !filename.includes('C:')) {
              console.log('Extracted filename using split:', filename);
              imageUrl = '/uploads/' + filename;
            }
          }
          console.log('ProfileImageUpload: Simplified imageUrl to:', imageUrl);
        }
      }
      
      userData.profileImage = imageUrl;
      localStorage.setItem("user", JSON.stringify(userData))

      // Call the callback to update parent component
      if (onImageUpdate) {
        onImageUpdate(data.imageUrl)
      }

      // Dispatch event for other components to update
      window.dispatchEvent(new Event("authChange"))

    } catch (error) {
      console.error("Profile image upload error:", error)
      setError(error.message || "Failed to upload profile image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    setIsUploading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/auth/remove-profile-image", {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to remove image")
      }

      console.log('ProfileImageUpload: Image removal successful, received response:', data);
      
      setSuccess("Profile image removed successfully!")
      
      // Update the user data in localStorage
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      userData.profileImage = null
      localStorage.setItem("user", JSON.stringify(userData))
      
      console.log('ProfileImageUpload: Updated localStorage user data after removal, profileImage set to null');

      // Call the callback to update parent component
      if (onImageUpdate) {
        onImageUpdate(null)
      }

      // Dispatch event for other components to update
      window.dispatchEvent(new Event("authChange"))

    } catch (error) {
      console.error("Profile image removal error:", error)
      setError(error.message || "Failed to remove profile image")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar
            src={currentImage ? getImageUrl(currentImage, 'user') : null}
            alt="Profile picture"
            size="xl"
            className="border-4 border-border"
            onError={(e) => handleImageError(e, 'user', 'Profile')}
          />
          {currentImage && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
              disabled={isUploading}
              title="Remove profile image"
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="relative"
          >
            {isUploading ? (
              <>
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icons.Camera className="mr-2 h-4 w-4" />
                {currentImage ? "Change Image" : "Upload Image"}
              </>
            )}
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/gif"
          className="hidden"
        />

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Recommended: Square image, at least 200x200px
          </p>
          <p className="text-xs text-muted-foreground">
            Max file size: 5MB • Formats: JPEG, PNG, GIF
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-center">
            <Icons.AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center">
            <Icons.CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
            <p className="text-sm text-emerald-500">{success}</p>
          </div>
        </div>
      )}
    </div>
  )
}
