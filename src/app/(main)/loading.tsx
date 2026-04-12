export default function MainRouteLoading() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-black px-4">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    </div>
  );
}
