"use client"

export const SkeletonLoader = ({ className = "", width = "w-full", height = "h-4", rounded = "rounded" }) => {
  return (
    <div className={`${width} ${height} ${rounded} bg-gray-800/50 animate-pulse ${className}`}>
      <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer"></div>
    </div>
  )
}

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Skeleton */}
      <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <SkeletonLoader width="w-16" height="h-16" rounded="rounded-full" />
            <div className="space-y-3">
              <SkeletonLoader width="w-48" height="h-8" />
              <SkeletonLoader width="w-32" height="h-5" />
              <SkeletonLoader width="w-40" height="h-4" />
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <SkeletonLoader width="w-20" height="h-9" />
            <SkeletonLoader width="w-24" height="h-9" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
        <div className="flex space-x-8">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonLoader key={item} width="w-24" height="h-10" />
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* About Card */}
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
            <SkeletonLoader width="w-20" height="h-6" className="mb-4" />
            <div className="space-y-3">
              <SkeletonLoader width="w-full" height="h-4" />
              <SkeletonLoader width="w-3/4" height="h-4" />
              <SkeletonLoader width="w-1/2" height="h-4" />
            </div>
          </div>

          {/* Achievements Card */}
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
            <SkeletonLoader width="w-32" height="h-6" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="border border-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <SkeletonLoader width="w-8" height="h-8" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader width="w-32" height="h-5" />
                      <SkeletonLoader width="w-full" height="h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <SkeletonLoader width="w-24" height="h-6" className="mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((statItem) => (
                  <div key={statItem} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SkeletonLoader width="w-8" height="h-8" rounded="rounded-lg" />
                      <SkeletonLoader width="w-20" height="h-4" />
                    </div>
                    <SkeletonLoader width="w-8" height="h-5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
