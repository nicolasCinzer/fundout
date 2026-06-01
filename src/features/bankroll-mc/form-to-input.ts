import type { BankrollMcFormValues } from './schema'
import type { BankrollMcInput } from './types'

export function formValuesToInput(values: BankrollMcFormValues): BankrollMcInput {
  return {
    bankroll: values.bankroll,
    cost: values.cost,
    payoutProb: values.payoutProb,
    payoutNet: values.payoutNet,
    targetBankroll: values.targetBankroll,
  }
}
