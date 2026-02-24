import * as React from "react"
import type * as UIType from "@repo/ui"

type UI = typeof UIType

function missing(name: string): React.ReactElement {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          width: "fit-content",
          borderRadius: 9999,
          padding: "2px 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#ffffff",
          backgroundColor: "#92400e",
          letterSpacing: "0.02em",
        }}
      >
        Status: In Progress
      </span>
      <div>Missing component: {name}</div>
    </div>
  )
}

export function ComponentDemo({ name, ui }: { name: string; ui: UI }): React.ReactElement {
  const u = ui as Record<string, any>

  switch (name) {
    case "Accordion":
      return u.Accordion ? (
        <u.Accordion type="single" collapsible className="w-full max-w-md">
          <u.AccordionItem value="item-1">
            <u.AccordionTrigger>Is it interactive?</u.AccordionTrigger>
            <u.AccordionContent>Yes, this is a real accordion interaction.</u.AccordionContent>
          </u.AccordionItem>
        </u.Accordion>
      ) : missing(name)
    case "Alert":
      return u.Alert ? (
        <u.Alert className="max-w-md">
          <u.AlertTitle>Heads up</u.AlertTitle>
          <u.AlertDescription>This is an actual rendered alert component.</u.AlertDescription>
        </u.Alert>
      ) : missing(name)
    case "AlertDialog":
      return u.AlertDialog ? (
        <u.AlertDialog>
          <u.AlertDialogTrigger asChild>
            <u.Button variant="outline">Open Alert Dialog</u.Button>
          </u.AlertDialogTrigger>
          <u.AlertDialogContent>
            <u.AlertDialogHeader>
              <u.AlertDialogTitle>Confirm action</u.AlertDialogTitle>
              <u.AlertDialogDescription>Proceed with this operation?</u.AlertDialogDescription>
            </u.AlertDialogHeader>
            <u.AlertDialogFooter>
              <u.AlertDialogCancel>Cancel</u.AlertDialogCancel>
              <u.AlertDialogAction>Continue</u.AlertDialogAction>
            </u.AlertDialogFooter>
          </u.AlertDialogContent>
        </u.AlertDialog>
      ) : missing(name)
    case "AspectRatio":
      return u.AspectRatio ? (
        <u.AspectRatio ratio={16 / 9} className="max-w-md rounded-md bg-muted p-4">
          <div style={{ height: "100%", display: "grid", placeItems: "center" }}>16:9</div>
        </u.AspectRatio>
      ) : missing(name)
    case "Avatar":
      return u.Avatar ? (
        <u.Avatar>
          <u.AvatarImage src="https://github.com/shadcn.png" alt="avatar" />
          <u.AvatarFallback>CN</u.AvatarFallback>
        </u.Avatar>
      ) : missing(name)
    case "Badge":
      return u.Badge ? <u.Badge>Badge</u.Badge> : missing(name)
    case "Breadcrumb":
      return u.Breadcrumb ? (
        <u.Breadcrumb>
          <u.BreadcrumbList>
            <u.BreadcrumbItem><u.BreadcrumbLink href="#">Home</u.BreadcrumbLink></u.BreadcrumbItem>
            <u.BreadcrumbSeparator />
            <u.BreadcrumbItem><u.BreadcrumbPage>Components</u.BreadcrumbPage></u.BreadcrumbItem>
          </u.BreadcrumbList>
        </u.Breadcrumb>
      ) : missing(name)
    case "Button":
      return u.Button ? <u.Button>Click me</u.Button> : missing(name)
    case "ButtonGroup":
      return u.ButtonGroup ? (
        <u.ButtonGroup>
          <u.Button variant="outline">Left</u.Button>
          <u.Button>Center</u.Button>
          <u.Button variant="outline">Right</u.Button>
        </u.ButtonGroup>
      ) : missing(name)
    case "Calendar": {
      const [date, setDate] = React.useState<Date | undefined>(new Date())
      return u.Calendar ? <u.Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" /> : missing(name)
    }
    case "Card":
      return u.Card ? (
        <u.Card className="max-w-md">
          <u.CardHeader><u.CardTitle>Card Title</u.CardTitle><u.CardDescription>Card description</u.CardDescription></u.CardHeader>
          <u.CardContent>Card content</u.CardContent>
          <u.CardFooter><u.Button size="sm">Action</u.Button></u.CardFooter>
        </u.Card>
      ) : missing(name)
    case "Carousel":
      return u.Carousel ? (
        <u.Carousel className="w-full max-w-xs">
          <u.CarouselContent>
            {[1, 2, 3].map((n) => (
              <u.CarouselItem key={n}>
                <u.Card><u.CardContent style={{ padding: 24, textAlign: "center" }}>Slide {n}</u.CardContent></u.Card>
              </u.CarouselItem>
            ))}
          </u.CarouselContent>
          <u.CarouselPrevious />
          <u.CarouselNext />
        </u.Carousel>
      ) : missing(name)
    case "Chart":
      return u.ChartContainer ? (
        <u.ChartContainer
          className="h-[220px] w-full max-w-md"
          config={{ visitors: { label: "Visitors", color: "hsl(220 90% 56%)" } }}
        >
          <div style={{ display: "grid", placeItems: "center", height: "100%" }}>Chart container</div>
        </u.ChartContainer>
      ) : missing(name)
    case "Checkbox": {
      const [checked, setChecked] = React.useState(true)
      return u.Checkbox ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <u.Checkbox checked={checked} onCheckedChange={setChecked} />
          Interactive checkbox
        </label>
      ) : missing(name)
    }
    case "Collapsible":
      return u.Collapsible ? (
        <u.Collapsible className="w-full max-w-md">
          <u.CollapsibleTrigger asChild><u.Button variant="outline">Toggle content</u.Button></u.CollapsibleTrigger>
          <u.CollapsibleContent style={{ marginTop: 8 }}>Collapsible content area.</u.CollapsibleContent>
        </u.Collapsible>
      ) : missing(name)
    case "Combobox": {
      const [value, setValue] = React.useState("react")
      return u.Combobox ? <u.Combobox value={value} onChange={setValue} options={[{ label: "React", value: "react" }, { label: "Vue", value: "vue" }, { label: "Svelte", value: "svelte" }]} /> : missing(name)
    }
    case "Command":
      return u.Command ? (
        <u.Command className="max-w-md rounded-md border">
          <u.CommandInput placeholder="Type a command..." />
          <u.CommandList>
            <u.CommandEmpty>No result.</u.CommandEmpty>
            <u.CommandGroup heading="Suggestions">
              <u.CommandItem>Profile</u.CommandItem>
              <u.CommandItem>Billing</u.CommandItem>
            </u.CommandGroup>
          </u.CommandList>
        </u.Command>
      ) : missing(name)
    case "ContextMenu":
      return u.ContextMenu ? (
        <u.ContextMenu>
          <u.ContextMenuTrigger asChild><u.Button variant="outline">Right click me</u.Button></u.ContextMenuTrigger>
          <u.ContextMenuContent>
            <u.ContextMenuItem>Edit</u.ContextMenuItem>
            <u.ContextMenuItem>Delete</u.ContextMenuItem>
          </u.ContextMenuContent>
        </u.ContextMenu>
      ) : missing(name)
    case "DataTable":
      return u.DataTable ? <u.DataTable columns={[{ key: "name", header: "Name" }, { key: "role", header: "Role" }]} data={[{ name: "Alice", role: "Admin" }, { name: "Bob", role: "Editor" }]} /> : missing(name)
    case "DatePicker": {
      const [value, setValue] = React.useState<Date | undefined>(new Date())
      return u.DatePicker ? <u.DatePicker value={value} onChange={setValue} /> : missing(name)
    }
    case "Dialog":
      return u.Dialog ? (
        <u.Dialog>
          <u.DialogTrigger asChild><u.Button variant="outline">Open Dialog</u.Button></u.DialogTrigger>
          <u.DialogContent>
            <u.DialogHeader>
              <u.DialogTitle>Dialog</u.DialogTitle>
              <u.DialogDescription>Actual interactive dialog.</u.DialogDescription>
            </u.DialogHeader>
          </u.DialogContent>
        </u.Dialog>
      ) : missing(name)
    case "Direction":
      return u.DirectionProvider ? (
        <div style={{ display: "grid", gap: 8 }}>
          <u.DirectionProvider dir="ltr"><u.Button variant="outline">LTR Sample</u.Button></u.DirectionProvider>
          <u.DirectionProvider dir="rtl"><u.Button variant="outline">RTL Sample</u.Button></u.DirectionProvider>
        </div>
      ) : missing(name)
    case "Drawer":
      return u.Drawer ? (
        <u.Drawer>
          <u.DrawerTrigger asChild><u.Button variant="outline">Open Drawer</u.Button></u.DrawerTrigger>
          <u.DrawerContent>
            <div style={{ padding: 16 }}>
              <u.DrawerHeader><u.DrawerTitle>Drawer</u.DrawerTitle><u.DrawerDescription>Interactive drawer.</u.DrawerDescription></u.DrawerHeader>
              <u.DrawerFooter><u.Button>Save</u.Button><u.DrawerClose asChild><u.Button variant="outline">Cancel</u.Button></u.DrawerClose></u.DrawerFooter>
            </div>
          </u.DrawerContent>
        </u.Drawer>
      ) : missing(name)
    case "DropdownMenu":
      return u.DropdownMenu ? (
        <u.DropdownMenu>
          <u.DropdownMenuTrigger asChild><u.Button variant="outline">Open Menu</u.Button></u.DropdownMenuTrigger>
          <u.DropdownMenuContent>
            <u.DropdownMenuItem>Profile</u.DropdownMenuItem>
            <u.DropdownMenuItem>Settings</u.DropdownMenuItem>
          </u.DropdownMenuContent>
        </u.DropdownMenu>
      ) : missing(name)
    case "Empty":
      return u.Empty ? <u.Empty>No data available</u.Empty> : missing(name)
    case "Field":
      return u.Field ? (
        <u.Field>
          <u.FieldLabel>Email</u.FieldLabel>
          <u.Input placeholder="name@company.com" />
          <u.FieldDescription>Use your work email.</u.FieldDescription>
        </u.Field>
      ) : missing(name)
    case "HoverCard":
      return u.HoverCard ? (
        <u.HoverCard>
          <u.HoverCardTrigger asChild><u.Button variant="outline">Hover me</u.Button></u.HoverCardTrigger>
          <u.HoverCardContent>Hover card content</u.HoverCardContent>
        </u.HoverCard>
      ) : missing(name)
    case "Input":
      return u.Input ? <u.Input placeholder="Type here..." /> : missing(name)
    case "InputGroup":
      return u.InputGroup ? (
        <u.InputGroup>
          <u.Kbd>Cmd</u.Kbd>
          <u.Input placeholder="Search..." />
        </u.InputGroup>
      ) : missing(name)
    case "InputOtp":
      return u.InputOTP ? (
        <u.InputOTP maxLength={4}>
          <u.InputOTPGroup>
            <u.InputOTPSlot index={0} />
            <u.InputOTPSlot index={1} />
            <u.InputOTPSlot index={2} />
            <u.InputOTPSlot index={3} />
          </u.InputOTPGroup>
        </u.InputOTP>
      ) : missing(name)
    case "Item":
      return u.Item ? <u.Item>Simple item block</u.Item> : missing(name)
    case "Kbd":
      return u.Kbd ? <u.Kbd>Ctrl + K</u.Kbd> : missing(name)
    case "Label":
      return u.Label ? <u.Label htmlFor="sample-input">Label</u.Label> : missing(name)
    case "Menubar":
      return u.Menubar ? (
        <u.Menubar>
          <u.MenubarMenu>
            <u.MenubarTrigger>File</u.MenubarTrigger>
            <u.MenubarContent><u.MenubarItem>New</u.MenubarItem><u.MenubarItem>Open</u.MenubarItem></u.MenubarContent>
          </u.MenubarMenu>
        </u.Menubar>
      ) : missing(name)
    case "NativeSelect":
      return u.NativeSelect ? (
        <u.NativeSelect defaultValue="kr">
          <option value="kr">Korea</option>
          <option value="us">United States</option>
        </u.NativeSelect>
      ) : missing(name)
    case "NavigationMenu":
      return u.NavigationMenu ? (
        <u.NavigationMenu>
          <u.NavigationMenuList>
            <u.NavigationMenuItem><u.NavigationMenuLink href="#">Home</u.NavigationMenuLink></u.NavigationMenuItem>
            <u.NavigationMenuItem><u.NavigationMenuLink href="#">Docs</u.NavigationMenuLink></u.NavigationMenuItem>
          </u.NavigationMenuList>
        </u.NavigationMenu>
      ) : missing(name)
    case "Pagination":
      return u.Pagination ? (
        <u.Pagination>
          <u.PaginationContent>
            <u.PaginationItem><u.PaginationPrevious href="#" /></u.PaginationItem>
            <u.PaginationItem><u.PaginationLink href="#" isActive>1</u.PaginationLink></u.PaginationItem>
            <u.PaginationItem><u.PaginationNext href="#" /></u.PaginationItem>
          </u.PaginationContent>
        </u.Pagination>
      ) : missing(name)
    case "Popover":
      return u.Popover ? (
        <u.Popover>
          <u.PopoverTrigger asChild><u.Button variant="outline">Open Popover</u.Button></u.PopoverTrigger>
          <u.PopoverContent>Popover content</u.PopoverContent>
        </u.Popover>
      ) : missing(name)
    case "Progress":
      return u.Progress ? <u.Progress value={66} className="w-[280px]" /> : missing(name)
    case "RadioGroup":
      return u.RadioGroup ? (
        <u.RadioGroup defaultValue="starter">
          <label style={{ display: "flex", gap: 8 }}><u.RadioGroupItem value="starter" id="starter" />Starter</label>
          <label style={{ display: "flex", gap: 8 }}><u.RadioGroupItem value="pro" id="pro" />Pro</label>
        </u.RadioGroup>
      ) : missing(name)
    case "Resizable":
      return u.ResizablePanelGroup ? (
        <u.ResizablePanelGroup direction="horizontal" className="max-w-md rounded-md border">
          <u.ResizablePanel defaultSize={50}><div style={{ padding: 12 }}>Panel A</div></u.ResizablePanel>
          <u.ResizableHandle />
          <u.ResizablePanel defaultSize={50}><div style={{ padding: 12 }}>Panel B</div></u.ResizablePanel>
        </u.ResizablePanelGroup>
      ) : missing(name)
    case "ScrollArea":
      return u.ScrollArea ? (
        <u.ScrollArea className="h-40 w-72 rounded-md border p-3">
          {Array.from({ length: 20 }).map((_, i) => <div key={i}>Row {i + 1}</div>)}
          <u.ScrollBar orientation="vertical" />
        </u.ScrollArea>
      ) : missing(name)
    case "Select":
      return u.Select ? (
        <u.Select defaultValue="kr">
          <u.SelectTrigger className="w-[220px]"><u.SelectValue placeholder="Select country" /></u.SelectTrigger>
          <u.SelectContent>
            <u.SelectItem value="kr">Korea</u.SelectItem>
            <u.SelectItem value="us">United States</u.SelectItem>
          </u.SelectContent>
        </u.Select>
      ) : missing(name)
    case "Separator":
      return u.Separator ? (
        <div className="max-w-md">
          <div>Top</div>
          <u.Separator className="my-3" />
          <div>Bottom</div>
        </div>
      ) : missing(name)
    case "Sheet":
      return u.Sheet ? (
        <u.Sheet>
          <u.SheetTrigger asChild><u.Button variant="outline">Open Sheet</u.Button></u.SheetTrigger>
          <u.SheetContent><div style={{ paddingTop: 24 }}>Sheet content</div></u.SheetContent>
        </u.Sheet>
      ) : missing(name)
    case "Sidebar":
      return u.SidebarProvider ? (
        <u.SidebarProvider>
          <div style={{ display: "flex", minHeight: 240, width: "100%" }}>
            <u.Sidebar>
              <u.SidebarContent>
                <u.SidebarGroup>
                  <u.SidebarGroupLabel>Menu</u.SidebarGroupLabel>
                  <u.SidebarMenu>
                    <u.SidebarMenuItem><u.SidebarMenuButton>Dashboard</u.SidebarMenuButton></u.SidebarMenuItem>
                  </u.SidebarMenu>
                </u.SidebarGroup>
              </u.SidebarContent>
            </u.Sidebar>
            <u.SidebarInset><div style={{ padding: 16 }}>Sidebar content area</div></u.SidebarInset>
          </div>
        </u.SidebarProvider>
      ) : missing(name)
    case "Skeleton":
      return u.Skeleton ? <u.Skeleton className="h-6 w-48" /> : missing(name)
    case "Slider":
      return u.Slider ? <u.Slider defaultValue={[40]} max={100} step={1} className="w-[280px]" /> : missing(name)
    case "Sonner":
      return u.Toaster ? (
        <div style={{ display: "grid", gap: 8 }}>
          <u.Button onClick={() => u.toast?.("Sonner toast message")}>Show Sonner Toast</u.Button>
          <u.Toaster />
        </div>
      ) : missing(name)
    case "Spinner":
      return u.Spinner ? <u.Spinner className="size-6" /> : missing(name)
    case "Switch":
      return u.Switch ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <u.Switch id="switch-demo" />
          <u.Label htmlFor="switch-demo">Enable setting</u.Label>
        </div>
      ) : missing(name)
    case "Table":
      return u.Table ? (
        <u.Table>
          <u.TableHeader><u.TableRow><u.TableHead>Name</u.TableHead><u.TableHead>Role</u.TableHead></u.TableRow></u.TableHeader>
          <u.TableBody>
            <u.TableRow><u.TableCell>Alice</u.TableCell><u.TableCell>Admin</u.TableCell></u.TableRow>
            <u.TableRow><u.TableCell>Bob</u.TableCell><u.TableCell>Editor</u.TableCell></u.TableRow>
          </u.TableBody>
        </u.Table>
      ) : missing(name)
    case "Tabs":
      return u.Tabs ? (
        <u.Tabs defaultValue="account" className="w-full max-w-md">
          <u.TabsList>
            <u.TabsTrigger value="account">Account</u.TabsTrigger>
            <u.TabsTrigger value="password">Password</u.TabsTrigger>
          </u.TabsList>
          <u.TabsContent value="account">Account settings</u.TabsContent>
          <u.TabsContent value="password">Password settings</u.TabsContent>
        </u.Tabs>
      ) : missing(name)
    case "Textarea":
      return u.Textarea ? <u.Textarea placeholder="Write a message..." className="max-w-md" /> : missing(name)
    case "Toast":
      return u.toast ? (
        <div style={{ display: "grid", gap: 8 }}>
          <u.Button onClick={() => u.toast("Toast fired")}>Trigger Toast</u.Button>
          {u.Toaster ? <u.Toaster /> : null}
        </div>
      ) : missing(name)
    case "Toggle": {
      const [on, setOn] = React.useState(false)
      return u.Toggle ? <u.Toggle pressed={on} onPressedChange={setOn}>{on ? "On" : "Off"}</u.Toggle> : missing(name)
    }
    case "ToggleGroup":
      return u.ToggleGroup ? (
        <u.ToggleGroup type="single" defaultValue="left">
          <u.ToggleGroupItem value="left">Left</u.ToggleGroupItem>
          <u.ToggleGroupItem value="center">Center</u.ToggleGroupItem>
          <u.ToggleGroupItem value="right">Right</u.ToggleGroupItem>
        </u.ToggleGroup>
      ) : missing(name)
    case "Tooltip":
      return u.TooltipProvider ? (
        <u.TooltipProvider>
          <u.Tooltip>
            <u.TooltipTrigger asChild><u.Button variant="outline">Hover Tooltip</u.Button></u.TooltipTrigger>
            <u.TooltipContent>Tooltip content</u.TooltipContent>
          </u.Tooltip>
        </u.TooltipProvider>
      ) : missing(name)
    case "Typography":
      return u.H1 ? (
        <div style={{ display: "grid", gap: 8 }}>
          <u.H1>Typography H1</u.H1>
          <u.H2>Typography H2</u.H2>
          <u.P>This is body paragraph.</u.P>
          <u.Muted>Muted text sample.</u.Muted>
        </div>
      ) : missing(name)
    default:
      return missing(name)
  }
}
