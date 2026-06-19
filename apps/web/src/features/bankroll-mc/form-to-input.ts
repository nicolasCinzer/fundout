import type { BankrollMcFormValues } from './schema'
import type { BankrollMcInput } from './types'

export function formValuesToInput(values: BankrollMcFormValues): BankrollMcInput {
  return {
    bankroll: values.bankroll as number,
    cost: values.cost as number,
    payoutProb: (values.payoutProbPct as number) / 100,
    payoutNet: values.payoutNet as number,
    targetBankroll: values.targetBankroll == null ? undefined : values.targetBankroll,
  }
}
