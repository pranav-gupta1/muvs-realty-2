import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { DEFAULT_SETTINGS, isPlaceholder } from '@/lib/site'
import { AdminPageHeader } from '@/components/admin/page-header'
import {
  AdminField,
  FormSection,
  SubmitButton,
  TextArea,
  TextInput,
} from '@/components/admin/form-fields'
import { SingleImagePicker } from '@/components/admin/single-image-picker'
import { SavedNotice } from '@/components/admin/saved-notice'
import { saveSettings } from './actions'

export const metadata: Metadata = { title: 'Site Settings', robots: { index: false } }

/** Flags a field that still holds a seeded "[FILL: …]" placeholder. */
function fillHint(value: string, hint: string) {
  return isPlaceholder(value) ? `Still a placeholder. ${hint}` : hint
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const [{ saved }, row] = await Promise.all([
    searchParams,
    prisma.siteSettings.findUnique({ where: { id: 'default' } }),
  ])
  const settings = row ?? DEFAULT_SETTINGS

  return (
    <>
      <AdminPageHeader
        title="Site Settings"
        description="Contact details, social links, hero copy and the trust-strip numbers. Director profiles live under Leadership. Anything left as a “[FILL: …]” placeholder is hidden on the website so it never shows as a broken link."
      />

      {saved ? <SavedNotice>Saved. Every page has been updated.</SavedNotice> : null}

      <form action={saveSettings} className="space-y-6">
        <FormSection title="Company">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Company name" htmlFor="companyName" required>
              <TextInput id="companyName" name="companyName" defaultValue={settings.companyName} required />
            </AdminField>
            <AdminField label="Tagline" htmlFor="tagline">
              <TextInput id="tagline" name="tagline" defaultValue={settings.tagline} />
            </AdminField>
          </div>
        </FormSection>

        <FormSection
          title="Contact"
          description="These drive the header, footer, WhatsApp button and every “call us” fallback in error messages."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="Phone"
              htmlFor="phone"
              hint={fillHint(settings.phone, 'Shown in the header and footer.')}
            >
              <TextInput id="phone" name="phone" defaultValue={settings.phone} placeholder="+91 98102 02834" />
            </AdminField>

            <AdminField
              label="WhatsApp number"
              htmlFor="whatsapp"
              hint={fillHint(settings.whatsapp, 'E.164 format, e.g. +919810202834. Powers the floating button.')}
            >
              <TextInput id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+919810202834" />
            </AdminField>

            <AdminField label="Email" htmlFor="email" hint={fillHint(settings.email, 'Public contact address.')}>
              <TextInput id="email" name="email" type="email" defaultValue={settings.email} />
            </AdminField>

            <AdminField label="Office hours" htmlFor="officeHours">
              <TextInput id="officeHours" name="officeHours" defaultValue={settings.officeHours} />
            </AdminField>

            <AdminField
              label="RERA registration number"
              htmlFor="reraNumber"
              hint={fillHint(settings.reraNumber, 'Displayed in the footer on every page.')}
            >
              <TextInput id="reraNumber" name="reraNumber" defaultValue={settings.reraNumber} />
            </AdminField>

            <AdminField label="Office address" htmlFor="address" className="sm:col-span-2">
              <TextArea id="address" name="address" rows={2} defaultValue={settings.address} />
            </AdminField>

            <AdminField
              label="Map embed URL"
              htmlFor="mapEmbedUrl"
              className="sm:col-span-2"
              hint="Google Maps → Share → Embed a map. Shown on /contact."
            >
              <TextInput id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={settings.mapEmbedUrl} />
            </AdminField>
          </div>
        </FormSection>

        <FormSection title="Social links" description="Empty or placeholder links are hidden, never rendered broken.">
          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ['instagram', 'Instagram'],
                ['facebook', 'Facebook'],
                ['linkedin', 'LinkedIn'],
                ['youtube', 'YouTube'],
              ] as const
            ).map(([key, label]) => (
              <AdminField key={key} label={label} htmlFor={key}>
                <TextInput
                  id={key}
                  name={key}
                  defaultValue={settings[key]}
                  placeholder={`https://…`}
                />
              </AdminField>
            ))}
          </div>
        </FormSection>

        <FormSection title="Home page hero">
          <AdminField label="Headline" htmlFor="heroTitle">
            <TextInput id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} />
          </AdminField>
          <AdminField label="Subheadline" htmlFor="heroSubtitle">
            <TextArea id="heroSubtitle" name="heroSubtitle" rows={3} defaultValue={settings.heroSubtitle} />
          </AdminField>
          <AdminField label="Hero background image">
            <SingleImagePicker name="heroImageUrl" initialUrl={settings.heroImageUrl} />
          </AdminField>
        </FormSection>

        <FormSection title="About page">
          <AdminField label="Company story" htmlFor="aboutStory" hint="Basic HTML is allowed.">
            <TextArea id="aboutStory" name="aboutStory" rows={8} defaultValue={settings.aboutStory} />
          </AdminField>
          <AdminField label="Mission" htmlFor="aboutMission">
            <TextArea id="aboutMission" name="aboutMission" rows={3} defaultValue={settings.aboutMission} />
          </AdminField>
        </FormSection>

        <FormSection
          title="Trust strip"
          description="The animated numbers on the home page and /about. Set any of them to 0 to hide it."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AdminField label="Years of experience" htmlFor="statYears">
              <TextInput id="statYears" name="statYears" inputMode="numeric" defaultValue={settings.statYears} />
            </AdminField>
            <AdminField label="Properties closed" htmlFor="statProperties">
              <TextInput
                id="statProperties"
                name="statProperties"
                inputMode="numeric"
                defaultValue={settings.statProperties}
              />
            </AdminField>
            <AdminField label="Cities served" htmlFor="statCities">
              <TextInput id="statCities" name="statCities" inputMode="numeric" defaultValue={settings.statCities} />
            </AdminField>
            <AdminField label="Happy clients" htmlFor="statClients">
              <TextInput
                id="statClients"
                name="statClients"
                inputMode="numeric"
                defaultValue={settings.statClients}
              />
            </AdminField>
          </div>
        </FormSection>

        <div className="flex justify-end">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </form>
    </>
  )
}
