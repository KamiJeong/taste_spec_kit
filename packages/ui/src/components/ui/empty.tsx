import * as React from "react"
import { cn } from "../../lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn("grid place-items-center rounded-md border border-dashed p-8 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Empty }
