export const FeatureCard = ({ title, children }) => {
  return (
    <div className="bg-black rounded-lg p-8">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      {children}
    </div>
  )
}
