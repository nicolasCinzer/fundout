import { createFileRoute } from "@tanstack/react-router"
import { BacktestListPage } from "@/features/backtest/components/backtest-list-page"

export const Route = createFileRoute("/_app/backtest")({
  component: BacktestListPage,
})
