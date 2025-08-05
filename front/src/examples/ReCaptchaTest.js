// ReCAPTCHA v3 Test Instructions

/*
TESTING reCAPTCHA v3 IMPLEMENTATION

1. DEVELOPMENT SETUP:
   - The current configuration uses Google's test keys for localhost
   - Test site key: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
   - Test secret key: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
   - These keys will ALWAYS return successful verification during development

2. TO TEST:
   - Start the backend: npm start (from f:\pfe\backend)
   - Start the frontend: npm start (from f:\pfe\front)
   - Go to http://localhost:3000
   - Try to register as a player
   - Check browser console for reCAPTCHA logs
   - Check backend console for verification logs

3. PRODUCTION SETUP:
   - Go to https://www.google.com/recaptcha/admin/create
   - Create a new reCAPTCHA v3 site
   - Add your domain(s)
   - Replace REACT_APP_RECAPTCHA_SITE_KEY in frontend .env
   - Replace RECAPTCHA_SECRET_KEY in backend .env
   - Set NODE_ENV=production in backend .env

4. DEBUGGING:
   - Check browser console for detailed reCAPTCHA logs
   - Check backend console for verification responses
   - Check Network tab for siteverify API calls
   - Verify the reCAPTCHA badge appears in bottom-right corner

5. COMMON ISSUES:
   - Domain mismatch: Ensure your domain is registered with reCAPTCHA
   - Missing keys: Verify environment variables are loaded
   - Network issues: Check if Google reCAPTCHA API is accessible
   - Score too low: Adjust the score threshold in middleware (currently 0.3)

6. SCORE INTERPRETATION (reCAPTCHA v3):
   - 1.0: Very likely a human
   - 0.9: Likely a human
   - 0.5: Neutral
   - 0.1: Likely a bot
   - 0.0: Very likely a bot
   - Current threshold: 0.3 (adjust in backend/middleware/recaptcha.js)
*/

export const RECAPTCHA_TEST_INSTRUCTIONS = {
  testKeys: {
    siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
  },
  productionSetup: 'https://www.google.com/recaptcha/admin/create',
  documentation: 'https://developers.google.com/recaptcha/docs/v3'
};
