import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function MacroSkeleton() {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
      <CardContent className="grid gap-2 p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

function MealSkeleton() {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
      <CardContent className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-52" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid gap-2 rounded-2xl bg-slate-50/80 p-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start justify-between gap-3">
              <div className="grid gap-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-12 size-56 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-10 pt-8">
        <Card className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-40" />
              </div>
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-full" />
            <div className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
              <Skeleton className="h-40 rounded-3xl" />
              <div className="grid gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <MacroSkeleton key={index} />
          ))}
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <MealSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
