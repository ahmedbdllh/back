import React from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Component that uses reCAPTCHA v3
const ReCaptchaV3Execute = React.forwardRef(({ action = 'submit', onVerify, onError }, ref) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    if (executeRecaptcha) {
      setIsReady(true);
      // Small delay to ensure the component is properly mounted
      const timer = setTimeout(() => {
        // Execute with the specific action to initialize and show badge
        executeRecaptcha(action).catch(() => {
          // Ignore errors - just want to initialize the badge
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [executeRecaptcha, action]);

  const handleExecute = React.useCallback(async () => {
    if (!executeRecaptcha) {
      console.warn('reCAPTCHA v3 not yet available');
      return null;
    }

    try {
      const token = await executeRecaptcha(action);
      console.log('reCAPTCHA v3 token generated successfully');
      if (onVerify) onVerify(token);
      return token;
    } catch (error) {
      console.error('reCAPTCHA v3 execution failed:', error);
      if (onError) onError(error.message || 'reCAPTCHA verification failed');
      return null;
    }
  }, [executeRecaptcha, action, onVerify, onError]);

  React.useImperativeHandle(ref, () => ({
    executeRecaptcha: handleExecute,
    isReady
  }));

  return null; // reCAPTCHA v3 is invisible
});

ReCaptchaV3Execute.displayName = 'ReCaptchaV3Execute';

const ReCaptchaV3 = React.forwardRef(({ siteKey, action = 'submit', onVerify, onError }, ref) => {
  const executeRef = React.useRef();

  React.useImperativeHandle(ref, () => ({
    executeRecaptcha: async () => {
      if (executeRef.current) {
        return await executeRef.current.executeRecaptcha();
      }
      return null;
    }
  }));
  // Properly style the reCAPTCHA badge when this component mounts
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'recaptcha-badge-style';
    style.innerHTML = `
      .grecaptcha-badge { 
        z-index: 9999 !important; 
        position: fixed !important;
        bottom: 14px !important;
        right: 14px !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        transition: none !important;
        transform: none !important;
        width: 70px !important;
        height: 60px !important;
        overflow: hidden !important;
      }
      
      /* Disable hover effects and animations */
      .grecaptcha-badge:hover {
        transform: none !important;
        transition: none !important;
        animation: none !important;
      }
      
      /* Keep the iframe minimal and prevent expansion */
      .grecaptcha-badge iframe {
        visibility: visible !important;
        opacity: 1 !important;
        width: 70px !important;
        height: 60px !important;
        max-width: 70px !important;
        max-height: 60px !important;
        transition: none !important;
        transform: none !important;
      }
      
      /* Prevent any expansion or animation on hover */
      .grecaptcha-badge iframe:hover {
        width: 70px !important;
        height: 60px !important;
        transform: none !important;
        transition: none !important;
        animation: none !important;
      }
      
      /* Disable any reCAPTCHA animations */
      .grecaptcha-badge * {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
    `;
    
    // Remove any existing style to avoid duplicates
    const existingStyle = document.getElementById('recaptcha-badge-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    return () => {
      // Clean up when component unmounts (modal closes)
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  if (!siteKey) {
    console.error('reCAPTCHA v3: Missing siteKey');
    if (onError) onError('Missing reCAPTCHA site key');
    return null;
  }

  return (
    <GoogleReCaptchaProvider 
      reCaptchaKey={siteKey}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: 'head'
      }}
    >
      <ReCaptchaV3Execute 
        ref={executeRef}
        action={action} 
        onVerify={onVerify} 
        onError={onError} 
      />
    </GoogleReCaptchaProvider>
  );
});

ReCaptchaV3.displayName = 'ReCaptchaV3';

export default ReCaptchaV3;
