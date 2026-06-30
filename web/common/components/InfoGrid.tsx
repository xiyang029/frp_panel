import type { ReactNode } from 'react'

export type InfoItem = readonly [label: string, value: ReactNode]

export function InfoGrid({
  items,
  columnsClassName = 'sm:grid-cols-2',
}: {
  items: InfoItem[]
  columnsClassName?: string
}) {
  return (
    <dl className={`grid gap-4 ${columnsClassName}`}>
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="break-all font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
