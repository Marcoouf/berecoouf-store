export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="h-6 w-40 rounded bg-mist animate-pulse" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-xl border bg-mist animate-pulse" />
        ))}
      </div>
    </div>
  )
}