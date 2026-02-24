import * as React from "react"
import { cn } from "../../lib/utils"

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="button-group" className={cn("inline-flex items-center gap-2", className)} {...props} />
}

export { ButtonGroup }
