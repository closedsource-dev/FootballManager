export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative w-24 h-40">
        {/* Bouncing soccer ball emoji */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-7xl animate-bounce">
          ⚽
        </div>
        {/* Shadow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30 animate-pulse" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-8 animate-pulse">Loading...</p>
    </div>
  );
}
