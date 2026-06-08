import { useState } from "react"
import { MoreHorizontal, Wallet, AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { PayoutFormDialog } from "@/features/payouts/components/payout-form-dialog"
import {
  useDeleteFundedAccount,
  useMarkFundedAccountBreached,
  useUndoMarkFundedAccountBreached,
  type FundedAccount,
} from "@/features/funded-accounts/api/funded-accounts-queries"

type FundedAccountRowActionsProps = {
  account: FundedAccount
}

export function FundedAccountRowActions({
  account,
}: FundedAccountRowActionsProps) {
  const { t } = useTranslation("funded")
  const [menuOpen, setMenuOpen] = useState(false)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const markBreached = useMarkFundedAccountBreached()
  const undoMarkBreached = useUndoMarkFundedAccountBreached()
  const deleteAccount = useDeleteFundedAccount()

  const isActive = account.status === "active"
  const isPending =
    markBreached.isPending || undoMarkBreached.isPending || deleteAccount.isPending
  const propfirmName = account.evaluation?.propfirm?.name ?? null

  const handleMarkBreached = () => {
    markBreached.mutate(account.id, {
      onSuccess: () => {
        toast.success(t("toasts.closed"), {
          duration: 6000,
          action: {
            label: "Undo",
            onClick: () => {
              undoMarkBreached.mutate(account.id, {
                onSuccess: () => toast.success("Undone", { duration: 3000 }),
                onError: (e) =>
                  toast.error(e.message || "Undo failed"),
              })
            },
          },
        })
      },
      onError: (e) => toast.error(e.message || t("toasts.errorClose")),
    })
  }

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deleteAccount.mutate(account.id, {
        onSuccess: () => {
          toast.success(t("toasts.deleted"))
          resolve()
        },
        onError: (e) => {
          toast.error(e.message || t("toasts.errorDelete"))
          reject(e)
        },
      })
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        {isActive && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPayoutDialogOpen(true)}
                  disabled={isPending}
                >
                  <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="sr-only">Log payout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Log payout</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMarkBreached}
                  disabled={isPending}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="sr-only">Mark as breached</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as breached</TooltipContent>
            </Tooltip>
          </>
        )}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <ConfirmDelete
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              }
              title="Delete this funded account?"
              description="This will also delete any payouts logged against it. The original evaluation will remain."
              pending={deleteAccount.isPending}
              onConfirm={async () => {
                await handleDelete()
                setMenuOpen(false)
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PayoutFormDialog
        open={payoutDialogOpen}
        onOpenChange={setPayoutDialogOpen}
        fundedAccountId={account.id}
        startDate={account.start_date}
        propfirmName={propfirmName}
      />
    </>
  )
}
