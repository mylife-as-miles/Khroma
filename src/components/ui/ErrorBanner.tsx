// ErrorBanner component for custom error and auto resolution prompt messages
export function ErrorBanner({ isWaiting }: { isWaiting: boolean }) {
  return (
    <div className="mt-4 rounded-lg overflow-hidden bg-slate-50 border border-[#cad5e2] py-3 px-4 flex items-center max-w-[580px]">
      {isWaiting && (
        <img
          src="/loading.svg"
          alt="Loading"
          className="size-[14px] animate-spin"
        />
      )}
      <span className="text-[#45556c] text-sm ml-2">
        Something went wrong. Please hold tight while we fix things behind the
        scenes
      </span>
    </div>
  );
}
