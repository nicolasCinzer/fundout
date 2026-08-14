// @vitest-environment happy-dom
/**
 * BacktestAccountChips tests (COMMIT 10 — RED first, then GREEN)
 * Satisfies: REQ-MA-CHIP-01..06, REQ-MA-BREACH-01..05, ADR-8
 * SCENARIO MA-CHIP-1..5, MA-BREACH-1..4
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { BacktestAccountChips } from "./backtest-account-chips"
import { BREACH_ANIM_MS } from "@/features/backtest/lib/compute-lifecycle-status"

const makeChip = (overrides: Partial<{
  id: string
  index: number
  label: string
  profit: number
  selected: boolean
  breaching: boolean
}> = {}) => ({
  id: "lc-A",
  index: 1,
  label: "Account 1",
  profit: 0,
  selected: false,
  breaching: false,
  ...overrides,
})

describe("BacktestAccountChips", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders one chip per entry", () => {
    const chips = [makeChip({ id: "lc-A", index: 1 }), makeChip({ id: "lc-B", index: 2 })]
    render(<BacktestAccountChips chips={chips} onSelect={vi.fn()} onBreachDone={vi.fn()} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("selected chip has distinct styling (data-selected attribute)", () => {
    const chips = [makeChip({ id: "lc-A", index: 1, selected: true })]
    render(<BacktestAccountChips chips={chips} onSelect={vi.fn()} onBreachDone={vi.fn()} />)
    const chip = screen.getByRole("button", { name: /1/ })
    expect(chip).toHaveAttribute("data-selected", "true")
  })

  it("clicking a chip calls onSelect with its id", () => {
    const onSelect = vi.fn()
    const chips = [makeChip({ id: "lc-B", index: 2 })]
    render(<BacktestAccountChips chips={chips} onSelect={onSelect} onBreachDone={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: /2/ }))
    expect(onSelect).toHaveBeenCalledWith("lc-B")
  })

  it("breaching chip has data-breaching attribute", () => {
    const chips = [makeChip({ id: "lc-A", index: 1, breaching: true })]
    render(<BacktestAccountChips chips={chips} onSelect={vi.fn()} onBreachDone={vi.fn()} />)
    const chip = screen.getByRole("button", { name: /1/ })
    expect(chip).toHaveAttribute("data-breaching", "true")
  })

  it("calls onBreachDone after BREACH_ANIM_MS when a chip is breaching", () => {
    const onBreachDone = vi.fn()
    const chips = [makeChip({ id: "lc-A", index: 1, breaching: true })]
    render(<BacktestAccountChips chips={chips} onSelect={vi.fn()} onBreachDone={onBreachDone} />)

    expect(onBreachDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(BREACH_ANIM_MS))
    expect(onBreachDone).toHaveBeenCalledWith("lc-A")
  })

  it("does NOT call onBreachDone before timer expires", () => {
    const onBreachDone = vi.fn()
    const chips = [makeChip({ id: "lc-A", index: 1, breaching: true })]
    render(<BacktestAccountChips chips={chips} onSelect={vi.fn()} onBreachDone={onBreachDone} />)

    act(() => vi.advanceTimersByTime(BREACH_ANIM_MS - 1))
    expect(onBreachDone).not.toHaveBeenCalled()
  })

  it("renders no chips when the array is empty", () => {
    render(<BacktestAccountChips chips={[]} onSelect={vi.fn()} onBreachDone={vi.fn()} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
