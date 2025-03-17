import React from "react";

const SkeletonLoader = () => {
  console.log("SkeletonLoader rendered");
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-4 bg-gray-300 rounded w-full" />
    </div>
  );
};

export default SkeletonLoader;
