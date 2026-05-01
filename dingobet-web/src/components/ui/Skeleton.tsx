// Base animated pulse block
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />;
}

// EventCard skeleton — matches EventCard layout
export function SkeletonEventCard() {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      {/* Sport + date row */}
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      {/* Teams row */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-7 w-10 rounded-md" />
        <Skeleton className="h-4 flex-1" />
      </div>
      {/* Odds buttons */}
      <div className="mt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 flex-1 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Bet card skeleton — matches bets page card layout
export function SkeletonBetCard() {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Notification row skeleton
export function SkeletonNotification() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-gray-100">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

// Sport button skeleton — matches home page sport rows
export function SkeletonSportRow() {
  return (
    <div className="flex w-full items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-5 rounded" />
    </div>
  );
}

// Error state — consistent across pages
export function ErrorState({ message = "Something went wrong.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
