/**
 * `npm run check:sms`
 *
 * Validates whatever the configured SMS provider needs, and verifies the
 * credentials against the provider's own API *before* any message is spent.
 * Run this after changing SMS_PROVIDER or its keys, and before going live.
 *
 *   npm run check:sms                     # configuration only, sends nothing
 *   npm run check:sms -- +919810202834    # also sends one real test message
 */
import { env } from '../src/lib/env'
import { SMS_PROVIDERS, getSmsProvider } from '../src/lib/otp/providers'
import { validatePhone } from '../src/lib/phone'

const ESC = '\u001b'
const GREEN = `${ESC}[32m`
const RED = `${ESC}[31m`
const YELLOW = `${ESC}[33m`
const DIM = `${ESC}[2m`
const RESET = `${ESC}[0m`

const ok = (message: string) => console.log(`  ${GREEN}✓${RESET} ${message}`)
const warn = (message: string) => console.log(`  ${YELLOW}!${RESET} ${message}`)
const fail = (message: string) => console.log(`  ${RED}✗${RESET} ${message}`)
const dim = (message: string) => console.log(`    ${DIM}${message}${RESET}`)

async function main() {
  console.log('\n  Phone verification: configuration check\n')

  let failures = 0

  /* 1. Provider selection */
  const configured = env.sms.provider
  const known = Object.keys(SMS_PROVIDERS)
  if (!known.includes(configured)) {
    fail(`SMS_PROVIDER is "${configured}", which is not one of: ${known.join(', ')}`)
    dim('The app falls back to "console", so local development still works.')
    failures++
  } else {
    ok(`SMS_PROVIDER = ${configured}`)
  }

  const provider = getSmsProvider()
  dim(provider.describe())

  /* 2. Dev mode */
  if (env.otp.devMode) {
    warn(`OTP_DEV_MODE is ON. Every code is "${env.otp.devCode}" and no SMS is sent.`)
    dim('This is the right setting for local development.')
    dim('Set OTP_DEV_MODE=false to send real messages. A production build refuses to start with it on.')
  } else {
    ok('OTP_DEV_MODE is off. Real codes will be generated and sent.')
  }

  /* 3. Hash secret */
  if (env.otp.hashSecret.startsWith('muvs-dev-only')) {
    warn('OTP_HASH_SECRET is not set, so an insecure development value is being used.')
    dim('Generate one with: openssl rand -hex 32')
  } else if (env.otp.hashSecret.length < 32) {
    warn(`OTP_HASH_SECRET is only ${env.otp.hashSecret.length} characters. Use at least 32.`)
  } else {
    ok('OTP_HASH_SECRET is set.')
  }

  /* 4. Required env vars for the selected provider */
  const required = provider.requiredEnv()
  if (required.length === 0) {
    ok('This provider needs no credentials.')
  } else {
    const missing = required.filter((name) => {
      // "A or B" entries are satisfied by either variable.
      const alternatives = name.split(' or ').map((part) => part.trim())
      return !alternatives.some((key) => (process.env[key] ?? '').trim().length > 0)
    })

    if (missing.length > 0) {
      fail(`Missing environment variables: ${missing.join(', ')}`)
      failures++
    } else {
      ok(`All required variables are set: ${required.join(', ')}`)
    }
  }

  /* 5. Live credential check — costs nothing, sends nothing */
  console.log('')
  const check = await provider.verifyCredentials()
  if (check.ok) {
    ok(check.message)
    if (check.detail) dim(check.detail)
  } else {
    fail(check.message)
    if (check.detail) dim(check.detail)
    failures++
  }

  /* 6. Limits in force */
  console.log('\n  Limits currently in force:')
  dim(
    `code length ${env.otp.codeLength} · expiry ${env.otp.ttlMinutes} min · ${env.otp.maxAttempts} attempts per code`,
  )
  dim(
    `${env.otp.maxPerPhonePerHour} codes per phone per hour · ${env.otp.maxSendPerIpPerHour} sends per IP per hour`,
  )
  dim(
    `${env.leads.maxPerIpPerHour} lead submissions per IP per hour · minimum fill time ${env.leads.minFillSeconds}s`,
  )

  /* 7. Optional live send */
  const target = process.argv[2]
  if (target) {
    console.log('')
    const parsed = validatePhone(target.replace(/^\+91/, ''), 'IN')
    const e164 = target.startsWith('+') ? target : parsed.ok ? parsed.e164 : null

    if (!e164) {
      fail(`"${target}" is not a valid number. Pass it in E.164, e.g. +919810202834`)
      failures++
    } else if (env.otp.devMode) {
      warn(`OTP_DEV_MODE is on, so no message would be sent to ${e164}.`)
    } else {
      console.log(`  Sending a test message to ${e164}…`)
      const result = await provider.send({
        to: e164,
        code: '000000',
        message: 'MUVS Realty configuration test. No action needed.',
      })
      if (result.ok) {
        ok(`Sent${result.providerMessageId ? ` (id ${result.providerMessageId})` : ''}.`)
      } else {
        fail(result.error)
        if (result.detail) dim(result.detail)
        failures++
      }
    }
  } else {
    console.log(`\n  ${DIM}Tip: pass a number to send a real test message:${RESET}`)
    console.log(`  ${DIM}npm run check:sms -- +919810202834${RESET}`)
  }

  console.log('')
  if (failures > 0) {
    console.log(`  ${RED}${failures} problem${failures === 1 ? '' : 's'} found.${RESET}\n`)
    process.exit(1)
  }
  console.log(`  ${GREEN}Configuration looks good.${RESET}\n`)
}

main().catch((error) => {
  console.error('\n  check:sms failed unexpectedly:\n', error)
  process.exit(1)
})
