Tech-Stack: specs/00-tech-stack.md

# shadcn Component Catalog

## Ownership

- Source: `packages/ui/src/components/ui/*`
- Consumption: `apps/storybook/src/stories/*` via `@repo/ui`

## Registry Components

- `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`
- `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`
- `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`
- `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`
- `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`
- `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`
- `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

## Custom Components

- `button-group`, `combobox`, `data-table`, `date-picker`
- `direction`, `empty`, `field`, `input-group`
- `item`, `kbd`, `native-select`, `spinner`
- `toast` (wrapper export), `typography`

## Notes

- `toast` is deprecated in upstream shadcn; project uses `sonner` and keeps `toast` as compatibility export.
- Story coverage exists per requested component in `apps/storybook/src/stories/components/*.stories.tsx`.

