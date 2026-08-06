export function MapSkeleton() {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-surface/60 sm:aspect-[16/10]">
      <div className="shimmer h-full w-full" />
    </div>
  );
}

export function TopSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="surface-card flex items-center gap-3 rounded-2xl p-3"
        >
          <div className="shimmer h-10 w-14 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-3 w-3/4 rounded-full" />
            <div className="shimmer h-2.5 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
