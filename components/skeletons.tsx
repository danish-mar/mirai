function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-[34rem] w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index}>
            <SkeletonBlock className="aspect-[2/3] w-full" />
            <SkeletonBlock className="mt-3 h-4 w-4/5" />
            <SkeletonBlock className="mt-2 h-3 w-2/5" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function DetailSkeleton() {
  return (
    <main>
      <SkeletonBlock className="h-[28rem] w-full rounded-none" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <SkeletonBlock className="aspect-[2/3] w-full" />
        <div>
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="mt-4 h-28 w-full" />
          <SkeletonBlock className="mt-6 h-12 w-48" />
        </div>
      </div>
    </main>
  );
}
