import { SETTINGS_ROUTE } from '@/constants'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(SETTINGS_ROUTE)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/settings/"!</div>
}
