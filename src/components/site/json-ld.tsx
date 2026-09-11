/**
 * Emits a JSON-LD block. The payload is built server-side from our own data in
 * src/lib/seo.ts, and serialised with `<` escaped so a stray character in a
 * title cannot break out of the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
