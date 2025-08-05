import { Icons } from "../../../../shared/ui/components/Icons"

export const AuthAlert = ({ type, message }) => {
  if (!message) return null

  const isError = type === "error"
  const bgColor = isError ? "bg-red-500/10" : "bg-green-500/10"
  const borderColor = isError ? "border-red-500/20" : "border-green-500/20"
  const textColor = isError ? "text-red-400" : "text-green-400"
  const IconComponent = isError ? Icons.AlertTriangle : Icons.CheckCircle
  const iconColor = isError ? "text-red-400" : "text-green-400"

  return (
    <div
      className={`${bgColor} ${borderColor} ${textColor} border px-4 py-3 rounded-lg flex items-center space-x-3 animate-fadeIn`}
    >
      <IconComponent className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
      <p className="text-sm">{message}</p>
    </div>
  )
}
