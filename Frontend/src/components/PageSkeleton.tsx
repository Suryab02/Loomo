import Skeleton from "./ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b border-[#ededed] bg-[#fafafa]" />
      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[20px] border border-[#ededed]" />
          ))}
        </div>

        <div className="border border-[#ededed] rounded-[24px] bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-6 border-b border-[#ededed]">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-[12px]" />
              <Skeleton className="h-10 w-32 rounded-[12px]" />
              <Skeleton className="h-10 w-32 rounded-[12px]" />
            </div>
          </div>
          <div className="divide-y divide-[#ededed]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <Skeleton className="w-12 h-12 rounded-[12px]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28 opacity-50" />
                  </div>
                </div>
                <div className="flex gap-3">
                   <Skeleton className="h-6 w-20 rounded-full" />
                   <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b border-[#ededed] bg-[#fafafa]" />
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-32 w-full rounded-[24px] mb-12" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[16px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[350px] rounded-[24px]" />
          <Skeleton className="h-[350px] rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
