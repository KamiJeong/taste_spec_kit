import * as React from "react"
import { cn } from "../../lib/utils"

function H1({ className, ...props }: React.ComponentProps<"h1">) { return <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight", className)} {...props} /> }
function H2({ className, ...props }: React.ComponentProps<"h2">) { return <h2 className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold", className)} {...props} /> }
function P({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("leading-7", className)} {...props} /> }
function Muted({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("text-sm text-muted-foreground", className)} {...props} /> }

export { H1, H2, Muted, P }
