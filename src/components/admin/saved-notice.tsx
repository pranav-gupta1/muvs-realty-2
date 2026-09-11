export function SavedNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded border border-gold-500/45 bg-gold-200/30 px-4 py-3 text-[13px] font-medium text-maroon-900">
      {children}
    </p>
  )
}
