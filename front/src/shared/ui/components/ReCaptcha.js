import React, { forwardRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

export const ReCaptcha = forwardRef(({ 
  siteKey, 
  onChange, 
  onExpired, 
  onError,
  theme = "dark",
  size = "normal",
  className = "",
  disabled = false 
}, ref) => {
  // Debug logging for siteKey
  console.log('ReCaptcha siteKey:', siteKey);
  
  if (!siteKey) {
    console.error('ReCaptcha: Missing siteKey prop');
    return <div className="text-red-500 text-sm">reCAPTCHA configuration error</div>;
  }
  const handleChange = (token) => {
    if (onChange) {
      onChange(token)
    }
  }

  const handleExpired = () => {
    if (onExpired) {
      onExpired()
    }
  }
  const handleError = () => {
    if (onError) {
      onError()
    }
  };
  
  return (
    <div className={`flex justify-center relative z-[9999] ${className}`}>
      <ReCAPTCHA
        ref={ref}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        onError={handleError}
        theme={theme}
        size={size}
        disabled={disabled}
        style={{ zIndex: 9999 }}
      />
    </div>
  )
})

ReCaptcha.displayName = "ReCaptcha"
