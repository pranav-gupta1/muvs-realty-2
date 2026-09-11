'use client'

import * as React from 'react'
import { Check, Copy, Link2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Share control. Uses the native share sheet where the browser offers one
 * (which is most phones), and otherwise falls back to WhatsApp + copy link.
 */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = React.useState(false)
  const [canNativeShare, setCanNativeShare] = React.useState(false)

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const url = () => (typeof window === 'undefined' ? path : `${window.location.origin}${path}`)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      toast.success('Link copied.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the link. Please copy it from the address bar.')
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url: url() })
    } catch {
      // The user dismissed the sheet — not an error worth surfacing.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Share this listing">
          <Share2 className="size-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canNativeShare ? (
          <>
            <DropdownMenuItem onSelect={nativeShare}>
              <Share2 />
              Share…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          onSelect={() => {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`,
              '_blank',
              'noopener,noreferrer',
            )
          }}
        >
          <Link2 />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copyLink}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
