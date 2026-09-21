import { VisualPoster } from "@/components/landing/visual-poster";

export default function CreationsLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <VisualPoster key={index} title="Créations" state="loading" />
        ))}
      </div>
    </div>
  );
}
