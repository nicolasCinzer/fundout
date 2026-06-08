import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
import { PayoutEditDialog } from "@/features/payouts/components/payout-edit-dialog"
import {
  useDeletePayout,
  type Payout,
} from "@/features/payouts/api/payouts-queries"

type PayoutRowActionsProps = {
  payout: Payout
}

export function PayoutRowActions({ payout }: PayoutRowActionsProps) {
  const { t } = useTranslation("payouts")
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const deletePayout = useDeletePayout()

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deletePayout.mutate(payout.id, {
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditOpen(true)}
              disabled={deletePayout.isPending}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t("actions.edit")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("actions.edit")}</TooltipContent>
        </Tooltip>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("actions.moreActions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
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
              title={t("rowActions.confirmTitle")}
              description={t("rowActions.confirmDescription")}
              pending={deletePayout.isPending}
              onConfirm={async () => {
                await handleDelete()
                setMenuOpen(false)
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PayoutEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        payout={payout}
      />
    </>
  )
}
