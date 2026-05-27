import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const deletePayout = useDeletePayout()

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deletePayout.mutate(payout.id, {
        onSuccess: () => {
          toast.success("Payout deleted")
          resolve()
        },
        onError: (e) => {
          toast.error(e.message || "Could not delete")
          reject(e)
        },
      })
    })
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false)
              setEditOpen(true)
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
            title="Delete this payout?"
            description="The payout will be permanently removed from your records."
            pending={deletePayout.isPending}
            onConfirm={async () => {
              await handleDelete()
              setMenuOpen(false)
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <PayoutEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        payout={payout}
      />
    </>
  )
}
