import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

type DataTableColumn<T> = { key: keyof T; header: string }

function DataTable<T extends Record<string, unknown>>({ columns, data }: { columns: DataTableColumn<T>[]; data: T[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => <TableHead key={String(c.key)}>{c.header}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            {columns.map((c) => <TableCell key={String(c.key)}>{String(row[c.key] ?? "")}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { DataTable }
