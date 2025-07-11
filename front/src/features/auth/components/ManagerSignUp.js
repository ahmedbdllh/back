import ReCaptchaV3 from '../../../shared/ui/components/ReCaptchaV3';
import { useState, useRef, useEffect } from "react"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Link } from "../../../shared/ui/components/Link"
import { Checkbox } from "../../../shared/ui/components/Checkbox"
import { FileUpload } from "../../../shared/ui/components/FileUpload"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"

export const ManagerSignUp = ({ onClose, onSwitchToManagerSignIn }) => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [cin, setCin] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const recaptchaRef = useRef(null)

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true)
      try {
        const response = await fetch("http://localhost:5001/api/companies/list/signup")
        if (response.ok) {
          const companiesData = await response.json()
          setCompanies(companiesData)
        } else {
          console.warn("Failed to fetch companies for signup")
        }
      } catch (error) {
        console.error("Error fetching companies:", error)
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchCompanies()
  }, [])

  const handleFileChange = (e) => {
    if (e.target && e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    } else if (e && e.files && e.files[0]) {
      setAttachment(e.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.")
      return
    }

    // Basic validation (more can be added)
    if (!fullName || !email || !companyName || !cin || !phoneNumber) {
      setError("All fields except attachment are required.")
      return
    }
    if (!attachment) {
      setError("Please upload the required document.")
      return
    }

    // Validate CIN is exactly 8 digits
    if (!/^\d{8}$/.test(cin)) {
      setError("CIN must be exactly 8 digits.")
      return
    }

    // Validate phone number is exactly 8 digits
    if (!/^\d{8}$/.test(phoneNumber)) {
      setError("Phone number must be exactly 8 digits.")
      return
    }    // Check reCAPTCHA v3
    let recaptchaToken = "";
    if (recaptchaRef.current) {
      try {
        recaptchaToken = await recaptchaRef.current.executeRecaptcha();
        if (!recaptchaToken) {
          setError("reCAPTCHA verification failed. Please try again.");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        setError("reCAPTCHA verification failed. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("fullName", fullName)
    formData.append("email", email)
    formData.append("companyName", companyName)
    formData.append("cin", cin)
    formData.append("phoneNumber", phoneNumber)
    formData.append("attachment", attachment)
    formData.append("recaptchaToken", recaptchaToken)

    try {
      console.log("Manager signup attempt:", {
        fullName,
        email,
        companyName,
        cin,
        phoneNumber,
        attachment: attachment ? attachment.name : null
      })
      const response = await fetch("http://localhost:5000/api/auth/manager/signup", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.msg || (data.errors && data.errors[0].msg) || "Manager registration failed")
      }
      
      setSuccessMessage("Account created successfully! Your application is pending admin approval. You will receive an email once approved.")

      // Do NOT store token or login automatically for managers
      // Managers need admin approval before they can login      if (onSwitchToManagerSignIn) setTimeout(() => onSwitchToManagerSignIn(), 3000);
    } catch (error) {
      console.error("Error during manager signup:", error)
      setError(error.message || "An error occurred during registration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecaptchaError = () => {
    setError("reCAPTCHA verification failed. Please try again.");
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close sign up form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}
      
      <AuthHeader title="Manager Sign Up" subtitle="Create an account to manage facilities." />

        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={successMessage} />

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="fullName-manager"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.User className="h-5 w-5" />}
            />
            <TextInput
              id="email-manager-signup"
              label="Email Address"
              type="email"
              placeholder="manager@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Mail className="h-5 w-5" />}
            />            <TextInput
              id="companyName-manager"
              label="Company Name"
              placeholder="Your Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Settings className="h-5 w-5" />}
            />
            
            {/* Display existing companies for reference */}
            {companies.length > 0 && (
              <div className="bg-[#0a0a1a]/60 border border-[#2a2a40] rounded-lg p-4">                <div className="flex items-center mb-3">
                  <Icons.Settings className="h-5 w-5 text-blue-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-300">
                    Existing Companies ({companies.length})
                  </h3>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {companies.map((company) => (
                    <div 
                      key={company._id} 
                      className="text-sm text-gray-400 px-2 py-1 bg-[#0a0a1a]/80 rounded cursor-pointer hover:bg-[#1a1a2a] transition-colors"
                      onClick={() => setCompanyName(company.companyName)}
                    >
                      {company.companyName}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on a company name to select it, or type a new one above.
                </p>
              </div>
            )}
            
            {loadingCompanies && (
              <div className="bg-[#0a0a1a]/60 border border-[#2a2a40] rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Icons.Spinner className="h-4 w-4 animate-spin mr-2" />
                  Loading existing companies...
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput
                id="cin-manager"
                label="CIN (National ID)"
                placeholder="12345678"
                type="text"
                pattern="[0-9]{8}"
                maxLength={8}
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                disabled={isLoading}
                required
                helpText="Must be exactly 8 digits"
                icon={<Icons.IdCard className="h-5 w-5" />}
              />
              <TextInput
                id="phoneNumber-manager"
                label="Phone Number"
                type="tel"
                placeholder="12345678"
                pattern="[0-9]{8}"
                maxLength={8}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                required
                helpText="Must be exactly 8 digits"
                icon={<Icons.Phone className="h-5 w-5" />}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="attachment-manager" className="block text-sm font-medium text-gray-300 mb-1">
                Identification Document (PDF, JPG, PNG)
              </label>
              <div className="bg-[#0a0a1a]/60 border border-[#2a2a40] rounded-lg p-4 hover:border-[#3a3a60] transition-all duration-300">
                <FileUpload
                  id="attachment-manager"
                  label="Attachment (e.g., Business License)"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full"
                />
                {attachment && (
                  <div className="mt-3 flex items-center text-sm text-gray-400 bg-[#0a0a1a]/80 rounded-md p-2">
                    <Icons.CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span>Selected: {attachment.name}</span>
                  </div>
                )}
              </div>
            </div>            {/* reCAPTCHA v3 (invisible) */}
            <ReCaptchaV3
              ref={recaptchaRef}
              siteKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              action="manager_signup"
              onError={handleRecaptchaError}
            />

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms-manager"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-1"
              />
              <label htmlFor="terms-manager" className="text-sm text-gray-300 select-none leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" variant="primary" className="font-medium text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" variant="primary" className="font-medium text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
              disabled={isLoading || !agreeToTerms}
            >
              {isLoading ? (
                <>
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Manager Account"
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link
              onClick={onSwitchToManagerSignIn}
              variant="primary"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in as Manager
            </Link>
          </p>
        </div>
    </div>
  )
}
