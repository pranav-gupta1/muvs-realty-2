import type { Metadata } from 'next'
import Link from 'next/link'

import { getSiteSettings } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import { PageHero } from '@/components/site/page-hero'
import { Section } from '@/components/site/section'
import { Reveal } from '@/components/site/reveal'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How MUVS Realty collects, uses and protects the personal information you share through this website, including phone verification, enquiries and cookies.',
  path: '/privacy',
})

/**
 * Privacy policy.
 *
 * The content describes what this application actually does, so it must be
 * revisited whenever data handling changes. In particular:
 *   - adding analytics, advertising or a chat widget invalidates "Cookies"
 *   - changing SMS_PROVIDER or the mail transport changes "Who we share with"
 *   - Lead and OtpChallenge fields drive "What we collect"
 *
 * TODO(legal): drafted from the code, not by a lawyer. Have it reviewed
 * against the DPDP Act 2023 before the site goes live.
 */
const LAST_UPDATED = '13 September 2026'

export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  const { contact } = settings

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        lede="What we collect when you use this website, why we collect it, and what you can ask us to do with it."
        crumbs={[{ label: 'Privacy Policy' }]}
      />

      <Section className="bg-cream-50">
        <div className="container max-w-3xl">
          <Reveal>
            <p className="tabular text-[13px] uppercase tracking-[0.12em] text-gold-500">
              Last updated: {LAST_UPDATED}
            </p>

            <div className="prose-brand mt-8">
              <h3>Who we are</h3>
              <p>
                This website is operated by {settings.companyName}, a real estate agency working
                across Noida, Greater Noida, the Yamuna Expressway and Delhi NCR.
                {contact.reraNumber ? (
                  <> We are registered with UP RERA under number {contact.reraNumber}.</>
                ) : null}
              </p>
              {contact.address ? (
                <p>
                  Our office is at {contact.address}.
                  {contact.email ? (
                    <>
                      {' '}
                      For anything to do with your personal information, write to us at{' '}
                      <a href={contact.mailtoHref ?? undefined}>{contact.email}</a>
                      {contact.phone ? (
                        <>
                          {' '}
                          or call <a href={contact.telHref ?? undefined}>{contact.phone}</a>
                        </>
                      ) : null}
                      .
                    </>
                  ) : null}
                </p>
              ) : null}

              <h3>What we collect</h3>
              <p>
                <strong>When you send an enquiry.</strong> The enquiry form asks for your name and
                phone number, and optionally your email address, the type of property you are
                interested in, your budget range, your preferred location and a description of what
                you are looking for. We also record which page you enquired from, and the project or
                listing the enquiry relates to.
              </p>
              <p>
                <strong>When we verify your phone number.</strong> Before an enquiry is saved, we
                send a one-time code to your number and ask you to enter it. We store the number, the
                time, and a one-way cryptographic hash of the code. The code itself is never written
                down anywhere and cannot be recovered from our records, not even by us. We also count
                incorrect attempts, so that a code cannot be guessed. These verification records are
                deleted automatically about a day after they expire.
              </p>
              <p>
                <strong>Technical information.</strong> We store the IP address and browser
                identifier (user agent) that an enquiry was submitted from. We use this only to stop
                automated abuse of the form and to apply submission limits. We do not use it to build
                a profile of you.
              </p>
              <p>
                <strong>Notes we add ourselves.</strong> After we speak to you, an advisor may add
                notes to your enquiry, such as what you are looking for or when to follow up.
              </p>

              <h3>Cookies</h3>
              <p>
                <strong>We do not use advertising or analytics cookies</strong>, and there are no
                tracking scripts on this site. We use two cookies, both strictly functional:
              </p>
              <ul>
                <li>
                  <strong>muvs_unlock</strong>: set after you verify your phone number on a
                  pre-launch page, so that the full details stay unlocked on your device. It contains
                  no personal information, cannot be read by scripts in your browser, and expires
                  after 30 days.
                </li>
                <li>
                  <strong>A session cookie for our own staff</strong> when they sign in to manage the
                  website. It is never set for ordinary visitors.
                </li>
              </ul>

              <h3>How we use your information</h3>
              <ul>
                <li>To answer your enquiry, by phone, WhatsApp or email.</li>
                <li>
                  To send you property options, pricing and documents relevant to the requirement you
                  described.
                </li>
                <li>
                  To confirm that a phone number belongs to the person using it, so that our
                  enquiries are genuine and you do not receive calls meant for someone else.
                </li>
                <li>To keep a record of our advice and the transaction, as a licensed agent.</li>
                <li>To protect the website against spam and automated abuse.</li>
              </ul>
              <p>
                We rely on your consent, which you give by submitting the form and verifying your
                number. You can withdraw it at any time by contacting us, and we will stop using your
                information and delete it unless we are required by law to keep it.
              </p>

              <h3>Who else sees your information</h3>
              <p>
                <strong>We do not sell your personal information, and we do not share it with other
                brokers or developers without asking you first.</strong> We do use a small number of
                service providers to run the website:
              </p>
              <ul>
                <li>
                  <strong>An SMS provider</strong> to deliver the one-time verification code. It
                  receives your phone number and the message.
                </li>
                <li>
                  <strong>An email provider</strong> to send you a confirmation and to notify our own
                  team about your enquiry.
                </li>
                <li>
                  <strong>Our hosting provider</strong>, which stores the website and its database.
                </li>
              </ul>
              <p>
                Some pages include content served by other companies, which means your browser
                contacts them directly and they may see your IP address:
              </p>
              <ul>
                <li>
                  <strong>Google Maps</strong> on the contact page and on some project pages, to show
                  the location.
                </li>
                <li>
                  <strong>YouTube</strong> on the videos page and on project pages. We use the
                  privacy-enhanced version of YouTube, and a video only loads once you click play.
                  Until then, only the thumbnail image is requested.
                </li>
                <li>
                  <strong>Image hosting</strong> for some photographs on the site.
                </li>
              </ul>
              <p>
                We may also disclose information if the law requires it, for example to a court or a
                regulator.
              </p>

              <h3>How long we keep it</h3>
              <p>
                We keep enquiries for as long as we are advising you, and afterwards as a record of
                the transaction. If you ask us to delete your information, we will do so unless we
                are legally required to keep it. Phone verification records are deleted
                automatically, roughly a day after they expire.
              </p>

              <h3>Your rights</h3>
              <p>
                Under the Digital Personal Data Protection Act, 2023, you can ask us to do the
                following with the information we hold about you:
              </p>
              <ul>
                <li>Tell you what we hold and what we have done with it.</li>
                <li>Correct anything that is wrong or incomplete.</li>
                <li>Delete it, where we are not required to keep it.</li>
                <li>Stop contacting you, or withdraw the consent you gave.</li>
                <li>Nominate someone to exercise these rights on your behalf.</li>
              </ul>
              <p>
                {contact.email ? (
                  <>
                    To make any of these requests, or to raise a complaint about how we have handled
                    your information, write to{' '}
                    <a href={contact.mailtoHref ?? undefined}>{contact.email}</a>
                    {contact.phone ? (
                      <>
                        {' '}
                        or call <a href={contact.telHref ?? undefined}>{contact.phone}</a>
                      </>
                    ) : null}
                    . We will respond as quickly as we can, and within 30 days.
                  </>
                ) : (
                  <>Contact us using the details on our contact page.</>
                )}{' '}
                If you are not satisfied with our answer, you may complain to the Data Protection
                Board of India.
              </p>

              <h3>How we protect your information</h3>
              <p>
                Verification codes are stored only as irreversible hashes. Access to enquiries is
                restricted to our own staff and protected by a password. The website is served over
                an encrypted connection. No system is perfectly secure, but we do not keep card or
                payment details on this website at any time.
              </p>

              <h3>Children</h3>
              <p>
                This website is meant for adults buying, selling or leasing property. We do not
                knowingly collect information from anyone under 18.
              </p>

              <h3>Changes to this policy</h3>
              <p>
                If we change how we handle personal information, we will update this page and change
                the date at the top. Please check it from time to time.
              </p>
            </div>

            <p className="mt-12 border-t border-gold-500/25 pt-6 text-[13.5px] text-ink-500">
              Questions about anything here?{' '}
              <Link
                href="/contact"
                className="font-medium text-maroon-700 underline underline-offset-2 hover:text-maroon-500"
              >
                Get in touch
              </Link>{' '}
              and we will explain it.
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  )
}
