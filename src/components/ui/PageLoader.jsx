export default function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 text-sm font-medium animate-pulse">Loading Workspace...</p>
    </div>
  );
}