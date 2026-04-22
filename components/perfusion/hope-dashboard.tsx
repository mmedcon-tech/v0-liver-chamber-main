'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { TelemetryPacket, Alarm } from '@/lib/perfusion-types'
import {
  Snowflake,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Activity,
  Gauge,
  Timer,
  TrendingDown,
  Power,
  Volume2,
  VolumeX,
  Waves,
  Zap,
  Info,
  Bug,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

interface HOPEDashboardProps {
  telemetry: TelemetryPacket | null
  history: Array<{
    timestamp: Date
    organTemp: number
    pvPressure: number
    pvFlow: number
    postOxygenatorDO: number
  }>
  alarms: Alarm[]
  elapsedTime: number
  flowRate: number
  pressureTargetEnabled: boolean
  onFlowRateChange: (value: number) => void
  onPressureTargetChange: (enabled: boolean) => void
  onStartNMP: () => void
  onPrimeCircuit: () => void
  onClearBubbles: () => void
  onEmergencyStop: () => void
  onAcknowledgeAlarm: (id: string) => void
  // Simulation props
  simulateBubbles: boolean
  onSimulateBubbles: (value: boolean) => void
  simulateHighPressure: boolean
  onSimulateHighPressure: (value: boolean) => void
  simulateTempDeviation: boolean
  onSimulateTempDeviation: (value: boolean) => void
  isPriming: boolean
  primingProgress: number
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'critical': return 'text-red-500'
    case 'warning': return 'text-amber-500'
    default: return 'text-cyan-500'
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'critical': return 'bg-red-500/20 border-red-500/50'
    case 'warning': return 'bg-amber-500/20 border-amber-500/50'
    default: return 'bg-cyan-500/10 border-cyan-500/30'
  }
}

export function HOPEDashboard({
  telemetry,
  history,
  alarms,
  elapsedTime,
  flowRate,
  pressureTargetEnabled,
  onFlowRateChange,
  onPressureTargetChange,
  onStartNMP,
  onPrimeCircuit,
  onClearBubbles,
  onEmergencyStop,
  onAcknowledgeAlarm,
  simulateBubbles,
  onSimulateBubbles,
  simulateHighPressure,
  onSimulateHighPressure,
  simulateTempDeviation,
  onSimulateTempDeviation,
  isPriming,
  primingProgress,
}: HOPEDashboardProps) {
  const unacknowledgedAlarms = alarms.filter(a => !a.acknowledged)
  const chartData = history.slice(-60).map((h, i) => ({ ...h, index: i }))
  
  // Chart colors
  const chartBlue = '#0ea5e9'
  const chartCyan = '#06b6d4'
  const chartTeal = '#14b8a6'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-3">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl px-5 py-3 flex items-center justify-between shadow-lg shadow-cyan-500/20 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Snowflake className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">HOPE Mode Active</h1>
            <p className="text-cyan-100 text-sm">Hypothermic Oxygenated Perfusion - 4°C</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-cyan-200 text-xs uppercase tracking-wide">Elapsed</p>
            <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-cyan-200 text-xs uppercase tracking-wide">Run ID</p>
            <p className="text-lg font-mono">{telemetry?.runId || '----'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm">Connected</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3">
        {/* Left Panel - Controls */}
        <div className="col-span-2 space-y-3">
          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                <Power className="w-4 h-4" /> Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                onClick={onStartNMP}
              >
                Switch to NMP
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 bg-transparent"
                onClick={onPrimeCircuit}
                disabled={isPriming}
              >
                {isPriming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Priming {primingProgress}%
                  </>
                ) : (
                  'Prime Circuit'
                )}
              </Button>
              {isPriming && (
                <Progress value={primingProgress} className="h-2 bg-slate-700 [&>div]:bg-cyan-500" />
              )}
              <Button 
                variant="outline" 
                className={`w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 bg-transparent ${
                  telemetry?.bubbleDetected ? 'border-red-500/50 text-red-300 animate-pulse' : ''
                }`}
                onClick={onClearBubbles}
              >
                {telemetry?.bubbleDetected ? 'Clear Bubbles (!)' : 'Clear Bubbles'}
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                onClick={onEmergencyStop}
              >
                Emergency Stop
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Flow Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Flow Rate</span>
                  <span className="text-cyan-400 font-mono">{flowRate}x</span>
                </div>
                <Slider
                  value={[flowRate]}
                  onValueChange={(v) => onFlowRateChange(v[0])}
                  max={10}
                  step={0.5}
                  className="[&_[role=slider]]:bg-cyan-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Pressure Target</span>
                <Switch 
                  checked={pressureTargetEnabled}
                  onCheckedChange={onPressureTargetChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Cooling</span>
                <span className="text-cyan-400 font-mono font-bold">{telemetry?.coolingPercent || 0}%</span>
              </div>
              <Progress value={telemetry?.coolingPercent || 0} className="h-2 bg-slate-700 [&>div]:bg-cyan-500" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Peltier Power</span>
                <span className="text-cyan-400 font-mono">{telemetry?.peltierPower || 0}W</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Humidity</span>
                <span className="text-cyan-400 font-mono">{telemetry?.chamberHumidity.toFixed(0) || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Test Simulation Panel */}
          <Card className="bg-slate-900/80 border-amber-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
                <Bug className="w-4 h-4" /> Test Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Simulate Bubbles</span>
                <Switch 
                  checked={simulateBubbles}
                  onCheckedChange={onSimulateBubbles}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">High Pressure</span>
                <Switch 
                  checked={simulateHighPressure}
                  onCheckedChange={onSimulateHighPressure}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Temp Deviation</span>
                <Switch 
                  checked={simulateTempDeviation}
                  onCheckedChange={onSimulateTempDeviation}
                />
              </div>
              <p className="text-xs text-slate-500 italic">Toggle to simulate alarm conditions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-7 space-y-3">
          {/* Primary Metrics Row */}
          <div className="grid grid-cols-4 gap-3">
            {/* Temperature - Primary Focus for HOPE */}
            <Card className={`bg-slate-900/80 backdrop-blur border-2 ${getStatusBg(telemetry?.organTemp.status || 'normal')}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Snowflake className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-400">Organ Temp</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getStatusColor(telemetry?.organTemp.status || 'normal')}`}>
                    {telemetry?.organTemp.value.toFixed(1) || '--'}
                  </span>
                  <span className="text-slate-400">°C</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                    Target: 4°C
                  </Badge>
                </div>
                <div className="h-12 mt-2 min-w-0">
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartCyan} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartCyan} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="organTemp" stroke={chartCyan} fill="url(#tempGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Portal Pressure */}
            <Card className={`bg-slate-900/80 backdrop-blur border-2 ${getStatusBg(telemetry?.pvPressure.status || 'normal')}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-400">PV Pressure</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getStatusColor(telemetry?.pvPressure.status || 'normal')}`}>
                    {telemetry?.pvPressure.value.toFixed(1) || '--'}
                  </span>
                  <span className="text-slate-400">mmHg</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Target: {'<'}5 mmHg</span>
                </div>
                <div className="h-12 mt-2 min-w-0">
                  <ResponsiveContainer width="100%" height={48}>
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="pvPressure" stroke={chartBlue} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Portal Flow */}
            <Card className={`bg-slate-900/80 backdrop-blur border-2 ${getStatusBg(telemetry?.pvFlow.status || 'normal')}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-400">PV Flow</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getStatusColor(telemetry?.pvFlow.status || 'normal')}`}>
                    {telemetry?.pvFlow.value.toFixed(0) || '--'}
                  </span>
                  <span className="text-slate-400">ml/min</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Target: 80-150 ml/min
                </div>
                <div className="h-12 mt-2 min-w-0">
                  <ResponsiveContainer width="100%" height={48}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartTeal} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartTeal} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="pvFlow" stroke={chartTeal} fill="url(#flowGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Oxygenation */}
            <Card className={`bg-slate-900/80 backdrop-blur border-2 ${getStatusBg(telemetry?.postOxygenatorDO.status || 'normal')}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-400">pO2</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getStatusColor(telemetry?.postOxygenatorDO.status || 'normal')}`}>
                    {telemetry?.postOxygenatorDO.value.toFixed(0) || '--'}
                  </span>
                  <span className="text-slate-400">mmHg</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                    80% O2
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Target: 400-600 mmHg</p>
              </CardContent>
            </Card>
          </div>

          {/* Temperature Zones & Trend */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> Temperature Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">Inlet (TS1)</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {telemetry?.inletTemp.value.toFixed(1) || '--'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">Reservoir (TS2)</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {telemetry?.reservoirTemp.value.toFixed(1) || '--'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-cyan-500/20 border border-cyan-500/30">
                      <span className="text-sm text-cyan-300">Organ (TS3)</span>
                      <span className="text-cyan-300 font-mono font-bold text-lg">
                        {telemetry?.organTemp.value.toFixed(1) || '--'}°C
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">HX Inlet (TS4)</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {telemetry?.heatExchangerIn.value.toFixed(1) || '--'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">HX Outlet (TS5)</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {telemetry?.heatExchangerOut.value.toFixed(1) || '--'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">Chamber RH</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {telemetry?.chamberHumidity.toFixed(0) || '--'}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Pressure Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[140px] min-w-0">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="index" hide />
                      <YAxis domain={[0, 10]} stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #0ea5e9',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <ReferenceLine y={3} stroke="#06b6d4" strokeDasharray="5 5" label={{ value: 'Target', fill: '#06b6d4', fontSize: 10 }} />
                      <Line type="monotone" dataKey="pvPressure" stroke={chartBlue} strokeWidth={2} dot={false} name="PV Pressure" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status Row */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">Pump</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {telemetry?.pvPumpRPM || 0}
                </div>
                <p className="text-xs text-slate-500">RPM</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">Bubble Trap</span>
                </div>
                <Badge className={`${
                  telemetry?.bubbleTrapStatus === 'OK' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                }`}>
                  {telemetry?.bubbleTrapStatus || 'OK'}
                </Badge>
                <p className="text-xs text-slate-500 mt-1">Bubbles: {telemetry?.bubbleCount || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">Reservoir</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {telemetry?.reservoirVolume || 0}
                </div>
                <p className="text-xs text-slate-500">mL</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">Gas Blend</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">O2:</span>
                    <span className="text-cyan-400 font-mono">{telemetry?.gasBlenderO2.toFixed(1) || 0} L/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CO2:</span>
                    <span className="text-cyan-400 font-mono">{telemetry?.gasBlenderCO2.toFixed(1) || 0} L/min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Alarms & Info */}
        <div className="col-span-3 space-y-3">
          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-cyan-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Alarms
                </span>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                  {unacknowledgedAlarms.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alarms.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No active alarms</p>
                ) : (
                  alarms.slice(-10).reverse().map((alarm) => (
                    <div
                      key={alarm.id}
                      className={`p-2 rounded text-sm flex items-center justify-between ${
                        alarm.acknowledged 
                          ? 'bg-slate-800/50 text-slate-500' 
                          : alarm.level === 'critical'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!alarm.acknowledged && (
                          alarm.level === 'critical' 
                            ? <Volume2 className="w-4 h-4 animate-pulse" />
                            : <AlertTriangle className="w-4 h-4" />
                        )}
                        <div>
                          <p className="font-medium">{alarm.parameter}</p>
                          <p className="text-xs opacity-75">
                            {alarm.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {!alarm.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs bg-transparent"
                          onClick={() => onAcknowledgeAlarm(alarm.id)}
                        >
                          ACK
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                <Info className="w-4 h-4" /> HOPE Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-cyan-300 font-medium">Single Vessel Perfusion</p>
                <p className="text-slate-400 text-xs">Portal Vein only - Hepatic Artery not used</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperature</span>
                  <span className="text-cyan-300">4°C (range: 0-12°C)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PV Pressure</span>
                  <span className="text-cyan-300">{'<'}5 mmHg optimal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PV Flow</span>
                  <span className="text-cyan-300">0.05-0.15 mL/min/g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Oxygen Mix</span>
                  <span className="text-cyan-300">80-95% O2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">pO2 Target</span>
                  <span className="text-cyan-300">400-600 mmHg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-400">System Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">MCU</span>
                <span className="text-slate-300">STM32-L475E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Oxygenator</span>
                <span className="text-slate-300">CAPIOX/HILITE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perfusate</span>
                <span className="text-slate-300">UW Solution</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
