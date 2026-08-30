import { createFileRoute } from '@tanstack/react-router'
import { AccountSection } from '@renderer/components/settings/account-section'
import { PlaybackSection } from '@renderer/components/settings/playback-section'
import { StorageSection } from '@renderer/components/settings/storage-section'
import { IntegrationsSection } from '@renderer/components/settings/integrations-section'
import { PrivacySection } from '@renderer/components/settings/privacy-section'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage
})

function SettingsPage(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pt-5 pb-12">
      <header className="flex items-center justify-between pb-1">
        <h1 className="text-[24px] leading-[1.25] font-bold tracking-[-0.02em] text-text">
          Settings
        </h1>
      </header>
      <div className="flex flex-col gap-10 pt-8">
        <Section title="Account">
          <AccountSection />
        </Section>
        <Section title="Playback">
          <PlaybackSection />
        </Section>
        <Section title="Privacy">
          <PrivacySection />
        </Section>
        <Section title="Integrations">
          <IntegrationsSection />
        </Section>
        <Section title="Storage">
          <StorageSection />
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[18px] leading-6 font-bold tracking-[-0.01em] text-text">{title}</h2>
      {children}
    </section>
  )
}
