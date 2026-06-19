import { useState } from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  propfirmSlug,
  useCreatePropfirm,
  type Propfirm,
} from "@/features/propfirms/api/propfirms-queries"
import { cn } from "@/lib/utils"

type PropfirmComboboxProps = {
  value: string
  onChange: (id: string) => void
  propfirms: Propfirm[]
  disabled?: boolean
  placeholder?: string
}

export function PropfirmCombobox({
  value,
  onChange,
  propfirms,
  disabled,
  placeholder = "Pick a propfirm…",
}: PropfirmComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const createMutation = useCreatePropfirm()

  const selected = propfirms.find((p) => p.id === value)
  const trimmed = search.trim()

  const handleCreate = () => {
    if (!trimmed) return
    createMutation.mutate(
      { name: trimmed, slug: propfirmSlug(trimmed), website: null },
      {
        onSuccess: (created) => {
          onChange(created.id)
          setSearch("")
          setOpen(false)
          toast.success(`Created ${created.name}`)
        },
        onError: (error) => {
          toast.error(error.message || "Could not create propfirm")
        },
      },
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected?.name ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search or type to create…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {trimmed ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>
                    Create &ldquo;<strong>{trimmed}</strong>&rdquo;
                  </span>
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No propfirms found.
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {propfirms.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onChange(p.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
