import { loadUsersPageState } from "@/actions/server/users/pages";
import { loadDailyLogFoodCatalogAction } from "@/actions/server/users/dashboard/daily-log/food-actions";
import { DashboardView } from "@/components/users/dashboard";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams: Promise<{ date?: string; tab?: string }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { date } = await searchParams;
  const { sessionUser, profile, dashboard, hasLoadError } = await loadUsersPageState({ requestedDateIso: date });
  const foodCatalogResult = await loadDailyLogFoodCatalogAction(sessionUser.userId);

  if (hasLoadError) {
    return (
      <main className="mx-auto grid w-full max-w-md gap-4 p-4 pt-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-red-600">No se pudo consultar la base de datos.</p>
      </main>
    );
  }

  return (
    <DashboardView
      userName={profile?.nombre ?? sessionUser.nombre}
      sessionEmail={sessionUser.email}
      sessionUserId={sessionUser.userId}
      initialFoods={foodCatalogResult.ok ? foodCatalogResult.foods ?? [] : []}
      profile={profile}
      dashboard={dashboard}
      isPlanPending={dashboard === null}
    />
  );
}

