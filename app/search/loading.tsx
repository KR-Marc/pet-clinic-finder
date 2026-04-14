export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-sm font-medium">搜尋中...</p>
      </div>
    </main>
  )
}
