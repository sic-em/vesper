import { createFileRoute } from '@tanstack/react-router'
import { ChangelogList } from '@renderer/components/changelog/changelog-list'

export const Route = createFileRoute('/_authenticated/changelog')({
  component: ChangelogPage
})

function ChangelogPage(): React.JSX.Element {
  return (
    <div className="flex flex-col px-6 pt-5 pb-12">
      <header className="flex items-center justify-between pb-1">
        <h1 className="text-[24px] leading-[1.25] font-bold tracking-[-0.02em] text-text">
          What's new
        </h1>
      </header>
      <div className="w-full pt-8">
        <ChangelogList />
      </div>
    </div>
  )
}
