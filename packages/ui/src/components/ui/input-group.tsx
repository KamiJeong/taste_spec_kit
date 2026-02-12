import * as React from "react"
import { cn } from "../../lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-group" className={cn("flex w-full items-center gap-2", className)} {...props} />
}

export { InputGroup }
