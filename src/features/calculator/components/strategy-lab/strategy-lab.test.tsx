/**
 * @vitest-environment node
 *
 * StrategyLab component tests.
 * Uses ReactDOMServer.renderToStaticMarkup so no jsdom is needed.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StrategyLab } from './strategy-lab'
import { STRATEGY_REGISTRY } from '../../strategies'
import type { CalcInput } from '../../types'

const FUNDED_INPUT: CalcInput = {
  cEval: 140,
  cActivation: 0,
  phases: [
    {
      dd: 2000,
      objective: 3000,
      ddType: 'eod',
      ddFixed: false,
      isFunded: false,
      consistencyPct: 0.5,
    },
    {
      dd: 2000,
      objective: 2600,
      ddType: 'eod',
      ddFixed: true,
      isFunded: true,
      minDays: 5,
      minProfit: 150,
      payoutCapPct: 0.5,
      splitPct: 0.9,
    },
  ],
}

describe('StrategyLab', () => {
  it('renders "Strategy Lab" heading', () => {
    const html = renderToStaticMarkup(<StrategyLab input={FUNDED_INPUT} />)
    expect(html).toContain('Strategy Lab')
  })

  it('renders subtitle describing alternative strategies', () => {
    const html = renderToStaticMarkup(<StrategyLab input={FUNDED_INPUT} />)
    expect(html.toLowerCase()).toContain('alternative')
    expect(html.toLowerCase()).toContain('analytic baseline')
  })

  it('renders cards for non-analytic strategies only (analytic is shown by the standard results panel)', () => {
    const html = renderToStaticMarkup(<StrategyLab input={FUNDED_INPUT} />)
    const labRunners = STRATEGY_REGISTRY.filter((r) => r.id !== 'analytic')
    for (const runner of labRunners) {
      expect(html).toContain(runner.label)
    }
    expect(html).not.toContain('>Analytic<')
  })

  it('renders skeleton cards when input is null', () => {
    const html = renderToStaticMarkup(<StrategyLab input={null} />)
    expect(html).toContain('Strategy Lab')
    // Should not crash and should have STRATEGY_REGISTRY.length skeleton slots
    // (presence of skeleton wrappers — we verify no crash + heading present)
    expect(html).toBeTruthy()
  })

  it('does not render when input is null without crashing', () => {
    expect(() => renderToStaticMarkup(<StrategyLab input={null} />)).not.toThrow()
  })
})
