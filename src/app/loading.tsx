export default function Loading() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
      role="status"
      aria-label="Chargement du contenu"
      aria-busy="true"
    >
      <span className="sr-only">Chargement…</span>
      <div className="h-6 w-32 sm:w-40 rounded bg-mist animate-pulse" />
      <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-6xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-xl border bg-mist animate-pulse w-full" />
        ))}
      </div>
    </div>
  )
}