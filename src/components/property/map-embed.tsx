/**
 * Google Maps embed. Lazy-loaded and sandboxed to a referrer-free policy;
 * renders nothing when no embed URL is configured, so the section simply
 * disappears rather than showing an empty frame.
 */
export function MapEmbed({ url, title }: { url: string | null | undefined; title: string }) {
  if (!url) return null

  return (
    <div className="overflow-hidden rounded border border-maroon-900/10 bg-white">
      <iframe
        src={url}
        title={`Map of ${title}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-[300px] w-full border-0 sm:h-[400px]"
      />
    </div>
  )
}
