import { useState, useRef } from "react"


export const FileUpload = ({ className = "", label, id, error, ...props }) => {
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
    }

    if (props.onChange) {
      props.onChange(e)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name)
      
      // Create a new event and dispatch it
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: { files: e.dataTransfer.files }
      })
      
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files
        fileInputRef.current.dispatchEvent(event)
      }
      
      if (props.onChange) {
        props.onChange(event)
      }
    }
  }

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div
        className={`relative ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor={id}
          className={`
            flex flex-col items-center justify-center w-full
            px-4 py-6 bg-input 
            border-2 border-dashed border-input rounded-lg
            cursor-pointer hover:border-primary/70 transition-colors
            duration-200 ${isDragging ? 'border-primary bg-primary/10' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <svg className="w-10 h-10 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground/80">
              {fileName || (props.accept ? `${props.accept.replace(/,/g, ', ')}` : 'All file types supported')}
            </p>
          </div>
          <input
            id={id}
            type="file"
            className="hidden"
            onChange={handleChange}
            ref={fileInputRef}
            {...props}
          />
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
