import { useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'

export const Route = createFileRoute('/_authenticated/join/$joinCode')({
  component: JoinPage
})

function JoinPage(): React.JSX.Element {
  const { joinCode } = Route.useParams()
  const navigate = useNavigate()
  const joinViaLink = useMutation(api.lists.joinViaLink)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    ;(async () => {
      try {
        const listId = await joinViaLink({ joinCode })
        navigate({ to: '/list/$id', params: { id: listId }, viewTransition: false, replace: true })
      } catch {
        navigate({ to: '/', replace: true })
      }
    })()
  }, [joinCode, joinViaLink, navigate])

  return (
    <div className="flex h-full items-center justify-center text-[13px] text-text-muted">
      Joining…
    </div>
  )
}
