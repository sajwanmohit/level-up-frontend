import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ExerciseAnalytics } from '../types'
import { ChartCard } from './ui'

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: '#8c9189', fontSize: 11 },
}

export function StrengthChart({ data }: { data: ExerciseAnalytics['strengthProgression'] }) {
  return (
    <ChartCard title="Estimated 1RM" subtitle="Bench press · kg">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 5, bottom: 0, left: -20 }}>
          <defs><linearGradient id="strengthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#426c4e" stopOpacity={0.18} /><stop offset="95%" stopColor="#426c4e" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#e9eae5" />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} {...axisProps} />
          <Tooltip formatter={(value) => [`${value} kg`, 'Estimated 1RM']} />
          <Area type="monotone" dataKey="e1rm" stroke="#315c43" strokeWidth={2.5} fill="url(#strengthFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function ExerciseVolumeChart({ data }: { data: ExerciseAnalytics['volumeOverTime'] }) {
  return (
    <ChartCard title="Volume over time" subtitle="Training volume · kg">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="#e9eae5" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kg`, 'Volume']} />
          <Area type="monotone" dataKey="volume" stroke="#668568" fill="#e4ece1" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
