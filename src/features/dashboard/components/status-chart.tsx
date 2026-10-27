"use client"

import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PERMIT_STATUS_META, statusColor, type PermitStatus } from "@/features/permits/status"

const config = Object.fromEntries(
  Object.entries(PERMIT_STATUS_META).map(([status, meta]) => [
    status,
    { label: meta.label, color: statusColor(status as PermitStatus) },
  ])
) satisfies ChartConfig

export function StatusChart({
  data,
  orgSlug,
}: {
  data: { status: PermitStatus; count: number }[]
  orgSlug: string
}) {
  const router = useRouter()
  const rows = data.map((d) => ({ ...d, label: PERMIT_STATUS_META[d.status].label }))
  const summary = rows.map((r) => `${r.label}: ${r.count}`).join(", ")

  return (
    <figure>
      <ChartContainer
        config={config}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={`Permits by status. ${summary}`}
      >
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="status" />}
          />
          <Bar
            dataKey="count"
            radius={4}
            className="cursor-pointer"
            onClick={(entry: { payload?: { status?: PermitStatus } }) => {
              const status = entry.payload?.status
              if (status) router.push(`/app/${orgSlug}/permits?status=${status}`)
            }}
          >
            {rows.map((r) => (
              <Cell key={r.status} fill={statusColor(r.status)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
