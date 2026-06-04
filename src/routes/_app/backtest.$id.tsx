import { createFileRoute } from "@tanstack/react-router"
import { BacktestDetailPage } from "@/features/backtest/components/backtest-detail-page"

export const Route = createFileRoute("/_app/backtest/$id")({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <BacktestDetailPage id={id} />
}
