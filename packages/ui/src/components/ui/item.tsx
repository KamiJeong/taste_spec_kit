import * as React from "react"
import { cn } from "../../lib/utils"

function Item({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item" className={cn("rounded-md border px-3 py-2", className)} {...props} />
}

export { Item }
