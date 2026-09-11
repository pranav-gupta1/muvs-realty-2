/**
 * Seed content for MUVS Realty.
 *
 * Every Unsplash photo ID and every YouTube video ID below was checked to
 * return a live asset. Project names, developers, RERA numbers and khasra
 * numbers are realistic but fictional — they are demo content, not real
 * registrations, and are meant to be replaced through /admin.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │ TODO(content): every "[FILL: ...]" value below is a placeholder the  │
 *  │ owner must replace. Search this file and /admin → Site Settings for  │
 *  │ them. Anything still unfilled is hidden in the UI rather than shown  │
 *  │ as a broken link.                                                    │
 *  └──────────────────────────────────────────────────────────────────────┘
 */

/** Builds a sized Unsplash URL from a verified photo ID. */
export const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

export const PHOTOS = {
  residential: [
    'photo-1560518883-ce09059eeffa',
    'photo-1512917774080-9991f1c4c750',
    'photo-1600585154340-be6161a56a0c',
    'photo-1580587771525-78b9dba3b914',
    'photo-1570129477492-45c003edd2be',
    'photo-1568605114967-8130f3a36994',
    'photo-1449844908441-8829872d2607',
    'photo-1523217582562-09d0def993a6',
    'photo-1512915922686-57c11dde9b6b',
  ],
  interior: [
    'photo-1502005229762-cf1b2da7c5d6',
    'photo-1493809842364-78817add7ffb',
    'photo-1522708323590-d24dbb6b0267',
    'photo-1484154218962-a197022b5858',
    'photo-1600607687939-ce8a6c25118c',
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600566753086-00f18fb6b3ea',
    'photo-1613490493576-7fde63acd811',
    'photo-1600047509807-ba8f99d2cdde',
  ],
  villa: [
    'photo-1613977257363-707ba9348227',
    'photo-1592595896551-12b371d546d5',
    'photo-1512699355324-f07e3106dae5',
    'photo-1580216643062-cf460548a66a',
    'photo-1600210492486-724fe5c67fb0',
  ],
  plot: [
    'photo-1500595046743-cd271d694d30',
    'photo-1464146072230-91cabc968266',
    'photo-1595246140625-573b715d11dc',
    'photo-1604014237800-1c9102c219da',
  ],
  agricultural: [
    'photo-1416331108676-a22ccb276e35',
    'photo-1500382017468-9049fed747ef',
    'photo-1574943320219-553eb213f72d',
    'photo-1531971589569-0d9370cbe1e5',
    'photo-1487958449943-2429e8be8625',
  ],
  industrial: [
    'photo-1565610222536-ef125c59da2e',
    'photo-1553413077-190dd305871c',
    'photo-1577495508048-b635879837f1',
    'photo-1504307651254-35680f356dfd',
  ],
  commercial: [
    'photo-1486406146926-c627a92ad1ab',
    'photo-1497366216548-37526070297c',
    'photo-1497366754035-f200968a6e72',
    'photo-1441986300917-64674bd600d8',
    'photo-1555636222-cae831e670b3',
    'photo-1567496898669-ee935f5f647a',
  ],
  construction: [
    'photo-1541888946425-d81bb19240f5',
    'photo-1590725140246-20acdee442be',
    'photo-1582407947304-fd86f028f716',
    'photo-1504307651254-35680f356dfd',
  ],
  documents: [
    'photo-1554995207-c18c203602cb',
    'photo-1524230572899-a752b3835840',
    'photo-1616486338812-3dadae4b4ace',
    'photo-1531973576160-7125cd663d86',
    'photo-1605276374104-dee2a0ed3cd6',
  ],
} as const

/** Google Maps embeds work without an API key in this form. */
export const mapEmbed = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`

export const AMENITY_SETS = {
  apartment: [
    'Clubhouse',
    'Swimming Pool',
    'Gymnasium',
    'Landscaped Gardens',
    "Children's Play Area",
    'Jogging Track',
    'Indoor Games Room',
    'Multipurpose Hall',
    '24×7 Power Backup',
    'CCTV Surveillance',
    'Gated Security',
    'Rainwater Harvesting',
    'Visitor Parking',
    'Amphitheatre',
  ],
  plotted: [
    'Gated Township',
    'Wide Internal Roads',
    'Underground Electricity',
    'Sewage Treatment Plant',
    'Landscaped Parks',
    'Community Centre',
    'Street Lighting',
    'Boundary Wall',
    'Water Supply Lines',
    '24×7 Security',
  ],
  villa: [
    'Private Garden',
    'Clubhouse',
    'Swimming Pool',
    'Gated Community',
    'Jogging Track',
    'Home Automation Ready',
    'Servant Quarter',
    'Covered Parking',
    'Power Backup',
    'Landscaped Avenue',
  ],
  commercial: [
    'High-Speed Elevators',
    'Central Air Conditioning',
    'Double-Height Lobby',
    'Ample Parking',
    '100% Power Backup',
    'Fire Safety Systems',
    'Food Court',
    'Facility Management',
    'Service Lifts',
    'Dedicated Loading Bay',
  ],
} as const
