'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Props {
  data: { date: string; revenue: number }[]
}

function formatRub(v: number) {
  return `${(v / 100).toLocaleString('ru-RU')} ₽`
}

function formatDate(d: string) {
  const [, month, day] = d.split('-')
  return `${day}.${month}`
}

export function RevenueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v: number) => formatRub(v)}
          width={90}
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(v) => [formatRub(Number(v)), 'Выручка']}
          labelFormatter={(label) => {
            const str = String(label)
            const [year, month, day] = str.split('-')
            return `${day}.${month}.${year}`
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#4a7c59"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
