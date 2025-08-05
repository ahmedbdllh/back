"use client"

import { cn } from "../../lib/utils"

export const Tabs = ({ tabs, activeTab, onTabChange, className }) => {
  return (
    <div className={cn("flex border-b border-gray-200 dark:border-gray-700", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors duration-200",
            activeTab === tab.id
              ? "text-sky-500 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}