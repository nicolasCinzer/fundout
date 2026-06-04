import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { EditBacktestMetaDialog } from "./edit-backtest-meta-dialog"
import { useDeleteBacktest } from "@/features/backtest/api/backtests-queries"
import type { Backtest } from "@/features/backtest/types"

type Props = {
  backtest: Backtest
}

export function BacktestCardActions({ backtest }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const deleteBacktest = useDeleteBacktest()

  const handleDelete = async () => {
    await new Promise<void>((resolve, reject) => {
      deleteBacktest.mutate(backtest.id, {
        onSuccess: () => {
          toast.success("Backtest deleted")
          resolve()
        },
        onError: (e) => {
          toast.error(e.message || "Could not delete backtest")
          reject(e)
        },
      })
    })
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              setRenameOpen(true)
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
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
            title="Delete this backtest?"
            description="This will permanently delete the backtest and all its events. This action cannot be undone."
            pending={deleteBacktest.isPending}
            onConfirm={async () => {
              await handleDelete()
              setMenuOpen(false)
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <EditBacktestMetaDialog
        backtest={backtest}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  )
}
