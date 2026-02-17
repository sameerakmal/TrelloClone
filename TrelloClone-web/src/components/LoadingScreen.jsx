const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Please wait!</h2>
        <p className="text-lg text-gray-600">Loading...</p>
        <div className="mt-4 flex gap-1 justify-center">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
