/**
 * `npm run check:taxonomy` (also runs as part of `npm run typecheck`)
 *
 * SQLite has no enums, so prisma/schema.prisma stores them as plain strings and
 * documents the allowed values in `/// @taxonomy(Name) A | B | C` comments.
 * This asserts those comments still match src/lib/taxonomy.ts exactly, so the
 * schema, the zod validators, the filter UIs and the admin forms cannot drift.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { TAXONOMY_REGISTRY } from '../src/lib/taxonomy'

const ESC = '\u001b'
const RED = `${ESC}[31m`
const GREEN = `${ESC}[32m`
const RESET = `${ESC}[0m`

const schema = readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8')

// Anchored to the start of a line so the prose in the schema header — which
// mentions the annotation format — is not mistaken for an annotation.
const ANNOTATION = /^\s*\/\/\/\s*@taxonomy\((\w+)\)\s*(.+)$/gm

const problems: string[] = []
let checked = 0

for (const match of schema.matchAll(ANNOTATION)) {
  const [, name, valuesText] = match
  checked++

  const taxonomy = TAXONOMY_REGISTRY[name as keyof typeof TAXONOMY_REGISTRY]
  if (!taxonomy) {
    problems.push(
      `@taxonomy(${name}) is not exported from TAXONOMY_REGISTRY in src/lib/taxonomy.ts`,
    )
    continue
  }

  const documented = valuesText
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)

  // Widened to string[] so it can be compared against the untyped comment text.
  const actual: string[] = [...taxonomy.values]
  const missing = actual.filter((value) => !documented.includes(value))
  const extra = documented.filter((value) => !actual.includes(value))

  if (missing.length > 0) {
    problems.push(`${name}: schema comment is missing ${missing.join(', ')}`)
  }
  if (extra.length > 0) {
    problems.push(`${name}: schema comment lists ${extra.join(', ')}, which no longer exist`)
  }
}

if (checked === 0) {
  console.error(`${RED}No @taxonomy annotations found in prisma/schema.prisma.${RESET}`)
  process.exit(1)
}

if (problems.length > 0) {
  console.error(
    `\n${RED}Taxonomy drift between prisma/schema.prisma and src/lib/taxonomy.ts:${RESET}\n`,
  )
  for (const problem of problems) console.error(`  • ${problem}`)
  console.error('\nUpdate the /// @taxonomy(...) comment in the schema to match.\n')
  process.exit(1)
}

console.log(`${GREEN}✓${RESET} ${checked} taxonomy annotations match src/lib/taxonomy.ts`)
