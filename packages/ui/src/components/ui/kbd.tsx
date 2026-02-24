import * as React from "react"
import { cn } from "../../lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd data-slot="kbd" className={cn("inline-flex h-6 items-center rounded border bg-muted px-2 text-xs", className)} {...props} />
}

export { Kbd }
