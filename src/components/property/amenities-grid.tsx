import {
  Baby,
  Building,
  Bus,
  Camera,
  Car,
  Dumbbell,
  Droplets,
  Fence,
  Flower2,
  Footprints,
  Gamepad2,
  Lightbulb,
  Lock,
  PartyPopper,
  Plug,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  Theater,
  Trees,
  Truck,
  Users,
  Utensils,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react'

/**
 * Maps an amenity name to an icon by keyword, so editors can type free-text
 * amenities in the admin without picking icons. Anything unmatched falls back
 * to a neutral mark rather than rendering nothing.
 */
const ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/pool|swim/i, Waves],
  [/gym|fitness/i, Dumbbell],
  [/club/i, Users],
  [/garden|landscap|park|green|avenue/i, Trees],
  [/child|kid|play/i, Baby],
  [/jog|walk|track/i, Footprints],
  [/game|indoor/i, Gamepad2],
  [/theatre|theater|cinema|amphi/i, Theater],
  [/hall|banquet|multipurpose|community/i, PartyPopper],
  [/power|backup|dg/i, Plug],
  [/cctv|surveillance|camera/i, Camera],
  [/securit|guard|gated/i, ShieldCheck],
  [/rain|water|sewage|stp/i, Droplets],
  [/parking|car/i, Car],
  [/lift|elevator/i, Building],
  [/air.?condition|hvac|central air/i, Wind],
  [/food|restaurant|cafe/i, Utensils],
  [/light|street/i, Lightbulb],
  [/boundary|wall|fence/i, Fence],
  [/road|internal|access/i, Bus],
  [/loading|truck|dock/i, Truck],
  [/washroom|toilet|servant/i, ShowerHead],
  [/fire|safety/i, ShieldCheck],
  [/automation|smart/i, Lock],
]

function iconFor(amenity: string): LucideIcon {
  return ICON_RULES.find(([pattern]) => pattern.test(amenity))?.[1] ?? Sparkles
}

export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {amenities.map((amenity) => {
        const Icon = iconFor(amenity)
        return (
          <li
            key={amenity}
            className="flex items-center gap-3 rounded border border-maroon-900/8 bg-white px-3.5 py-3 text-[13.5px] text-ink-900 transition-colors hover:border-gold-500/60"
          >
            <Icon className="size-4 shrink-0 text-gold-500" aria-hidden="true" />
            <span className="leading-snug">{amenity}</span>
          </li>
        )
      })}
    </ul>
  )
}
