import { Button } from "./Button"

export const SportCard = ({ title, description, href }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 mb-6 flex-grow">{description}</p>
      <Button variant="outline" className="w-full justify-center">
        Explore {title}
      </Button>
    </div>
  )
}
