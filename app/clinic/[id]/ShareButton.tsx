'use client'

export default function ShareButton({ name }: { name: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${name} | 台北寵物專科診所`,
        text: `推薦這家診所：${name}`,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('連結已複製！')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="px-4 py-3 rounded-xl font-medium text-sm transition-colors hover:text-snow border border-mist/30 bg-ink text-mist"
      aria-label="分享此診所"
    >
      🔗 分享
    </button>
  )
}
