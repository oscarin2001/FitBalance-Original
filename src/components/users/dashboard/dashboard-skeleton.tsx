import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { TopHeaderSkeleton } from "./top-header";

function SummarySkeleton() {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
      <CardContent className="grid gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="size-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>

        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)] items-center gap-4">
          <Skeleton className="aspect-square rounded-[1.5rem]" />

          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-100">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-full rounded-full" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
          </div>
        </div>

        <Skeleton className="h-14 rounded-2xl" />
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
    <>
      <TopHeaderSkeleton />
      <main className="relative min-h-svh overflow-hidden bg-slate-50 pb-44 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-14 top-12 size-56 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/25 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-10">
          <SummarySkeleton />

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
    </>
  );
}
