"use client"

import { format, parseISO } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const config = {
  count: { label: "Permits expiring", color: "var(--status-expired)" },
} satisfies ChartConfig

export function ExpiryChart({
  data,
}: {
  data: { week: number; start: string; end: string; count: number }[]
}) {
  const rows = data.map((w) => ({
    ...w,
    label: format(parseISO(w.start), "MMM d"),
    range: `${format(parseISO(w.start), "MMM d")} – ${format(parseISO(w.end), "MMM d")}`,
  }))
  const summary = rows.map((r) => `${r.range}: ${r.count}`).join(", ")

  return (
    <figure>
      <ChartContainer
        config={config}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={`Permits expiring by week. ${summary}`}
      >
        <BarChart data={rows} margin={{ left: -16, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => `Week of ${payload?.[0]?.payload?.range ?? ""}`}
              />
            }
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ChartContainer>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  )
}
