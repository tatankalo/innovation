export default function Loading() {
  return (
    <div className="px-4 sm:px-8 pt-12 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-40 bg-rule rounded" />
      <div className="mt-6 h-9 w-11/12 bg-rule rounded" />
      <div className="mt-3 h-9 w-2/3 bg-rule rounded" />
      <div className="mt-10 space-y-3">
        {[100, 96, 92, 98, 70].map((w, i) => (
          <div key={i} className="h-4 bg-rule rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
