export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-16 border-b border-[#ededed] bg-[#fafafa]" />
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="h-9 w-48 bg-[#ededed] rounded-lg mb-2" />
        <div className="h-4 w-72 bg-[#f5f5f5] rounded mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#f7f7f7] rounded-[16px] border border-[#ededed]" />
          ))}
        </div>
        <div className="h-[420px] bg-[#fafafa] rounded-[16px] border border-[#ededed]" />
      </div>
    </div>
  )
}

export function InsightsSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="h-16 border-b border-[#ededed] bg-[#fafafa]" />
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="h-9 w-40 bg-[#ededed] rounded-lg mb-10" />
        <div className="h-32 bg-[#f5f3ff] rounded-[20px] mb-10 border border-[#ede9fe]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#f7f7f7] rounded-[16px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[280px] bg-[#fafafa] rounded-[16px] border border-[#ededed]" />
          <div className="h-[280px] bg-[#fafafa] rounded-[16px] border border-[#ededed]" />
        </div>
      </div>
    </div>
  )
}
