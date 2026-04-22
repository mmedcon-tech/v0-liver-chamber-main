'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TelemetryPacket, Alarm } from '@/lib/perfusion-types'
import {
  Flame,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Activity,
  Gauge,
  TrendingUp,
  Power,
  Volume2,
  Waves,
  Zap,
  Info,
  Heart,
  TestTube,
  Beaker,
  CircleDot,
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
  RadialBarChart,
  RadialBar,
} from 'recharts'

interface NMPDashboardProps {
  telemetry: TelemetryPacket | null
  history: Array<{
    timestamp: Date
    organTemp: number
    pvPressure: number
    pvFlow: number
    haPressure: number
    haFlow: number
    postOxygenatorDO: number
    pH: number
    bileFlow: number
    lactate: number
  }>
  alarms: Alarm[]
  elapsedTime: number
  flowRate: number
  pressureTargetEnabled: boolean
  logDataEnabled: boolean
  onFlowRateChange: (value: number) => void
  onPressureTargetChange: (enabled: boolean) => void
  onLogDataChange: (enabled: boolean) => void
  onStop: () => void
  onPrimeCircuit: () => void
  onClearBubbles: () => void
  onEmergencyStop: () => void
  onAcknowledgeAlarm: (id: string) => void
  // Simulation props
  simulateBubbles: boolean
  onSimulateBubbles: (value: boolean) => void
  simulateLowBileFlow: boolean
  onSimulateLowBileFlow: (value: boolean) => void
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
    default: return 'text-orange-500'
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'critical': return 'bg-red-500/20 border-red-500/50'
    case 'warning': return 'bg-amber-500/20 border-amber-500/50'
    default: return 'bg-orange-500/10 border-orange-500/30'
  }
}

export function NMPDashboard({
  telemetry,
  history,
  alarms,
  elapsedTime,
  flowRate,
  pressureTargetEnabled,
  logDataEnabled,
  onFlowRateChange,
  onPressureTargetChange,
  onLogDataChange,
  onStop,
  onPrimeCircuit,
  onClearBubbles,
  onEmergencyStop,
  onAcknowledgeAlarm,
  simulateBubbles,
  onSimulateBubbles,
  simulateLowBileFlow,
  onSimulateLowBileFlow,
  simulateHighPressure,
  onSimulateHighPressure,
  simulateTempDeviation,
  onSimulateTempDeviation,
  isPriming,
  primingProgress,
}: NMPDashboardProps) {
  const [activeTab, setActiveTab] = useState('main')
  const unacknowledgedAlarms = alarms.filter(a => !a.acknowledged)
  const chartData = history.slice(-60).map((h, i) => ({ ...h, index: i }))
  
  // Chart colors - warm orange theme
  const chartOrange = '#f97316'
  const chartAmber = '#f59e0b'
  const chartRed = '#ef4444'
  
  // Gauge data for radial charts
  const pHGaugeData = [
    { name: 'pH', value: telemetry ? ((telemetry.gasParams.pH.value - 7.0) / 0.8) * 100 : 0, fill: chartOrange }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/30 to-slate-950 text-white p-3">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl px-5 py-3 flex items-center justify-between shadow-lg shadow-orange-500/20 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">NMP Mode Active</h1>
            <p className="text-orange-100 text-sm">Normothermic Machine Perfusion - 37°C</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-orange-200 text-xs uppercase tracking-wide">Elapsed</p>
            <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-orange-200 text-xs uppercase tracking-wide">Run ID</p>
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
          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                <Power className="w-4 h-4" /> Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={onStop}
              >
                Stop NMP
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/20 bg-transparent"
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
                <Progress value={primingProgress} className="h-2 bg-slate-700 [&>div]:bg-orange-500" />
              )}
              <Button 
                variant="outline" 
                className={`w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/20 bg-transparent ${
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

          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Flow Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Flow Rate</span>
                  <span className="text-orange-400 font-mono">{flowRate}x</span>
                </div>
                <Slider
                  value={[flowRate]}
                  onValueChange={(v) => onFlowRateChange(v[0])}
                  max={10}
                  step={0.5}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Pressure Target</span>
                <Switch 
                  checked={pressureTargetEnabled}
                  onCheckedChange={onPressureTargetChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Log Data</span>
                <Switch 
                  checked={logDataEnabled}
                  onCheckedChange={onLogDataChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dual Vessel Status */}
          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                <Heart className="w-4 h-4" /> Perfusion Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-300">Hepatic Artery</span>
                  <Badge className="bg-red-500/20 text-red-300 text-xs">Active</Badge>
                </div>
                <p className="text-lg font-bold text-red-400 font-mono">
                  {telemetry?.haFlow.value.toFixed(0) || '--'} ml/min
                </p>
              </div>
              <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-orange-300">Portal Vein</span>
                  <Badge className="bg-orange-500/20 text-orange-300 text-xs">Active</Badge>
                </div>
                <p className="text-lg font-bold text-orange-400 font-mono">
                  {telemetry?.pvFlow.value.toFixed(0) || '--'} ml/min
                </p>
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
                <span className="text-xs text-slate-400">Low Bile Flow</span>
                <Switch 
                  checked={simulateLowBileFlow}
                  onCheckedChange={onSimulateLowBileFlow}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="main" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Main</TabsTrigger>
              <TabsTrigger value="gas" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Gas/O2</TabsTrigger>
              <TabsTrigger value="lft" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">LFT</TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-2 space-y-3">
              {/* Primary Metrics - Dual Vessel */}
              <div className="grid grid-cols-2 gap-3">
                {/* Portal Vein Section */}
                <Card className="bg-gradient-to-br from-orange-950/50 to-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                      <CircleDot className="w-4 h-4" /> Portal Vein (PV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${getStatusBg(telemetry?.pvPressure.status || 'normal')}`}>
                        <p className="text-xs text-slate-400 mb-1">Pressure</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${getStatusColor(telemetry?.pvPressure.status || 'normal')}`}>
                            {telemetry?.pvPressure.value.toFixed(1) || '--'}
                          </span>
                          <span className="text-slate-400 text-sm">mmHg</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Target: 10 mmHg</p>
                      </div>
                      <div className={`p-3 rounded-lg ${getStatusBg(telemetry?.pvFlow.status || 'normal')}`}>
                        <p className="text-xs text-slate-400 mb-1">Flow</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${getStatusColor(telemetry?.pvFlow.status || 'normal')}`}>
                            {telemetry?.pvFlow.value.toFixed(0) || '--'}
                          </span>
                          <span className="text-slate-400 text-sm">ml/min</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Target: 1000-1200</p>
                      </div>
                    </div>
                    <div className="h-16 mt-3 min-w-0">
                      <ResponsiveContainer width="100%" height={64}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="pvFlowGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartOrange} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={chartOrange} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="pvFlow" stroke={chartOrange} fill="url(#pvFlowGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Hepatic Artery Section */}
                <Card className="bg-gradient-to-br from-red-950/50 to-slate-900/80 border-red-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Hepatic Artery (HA)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${getStatusBg(telemetry?.haPressure.status || 'normal')}`}>
                        <p className="text-xs text-slate-400 mb-1">Pressure</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${telemetry?.haPressure.status === 'warning' ? 'text-amber-500' : 'text-red-400'}`}>
                            {telemetry?.haPressure.value.toFixed(0) || '--'}
                          </span>
                          <span className="text-slate-400 text-sm">mmHg</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Target: 60 mmHg</p>
                        {telemetry?.haPressure.status === 'warning' && (
                          <Badge className="mt-1 bg-amber-500/20 text-amber-300 border-amber-500/50 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OR
                          </Badge>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${getStatusBg(telemetry?.haFlow.status || 'normal')}`}>
                        <p className="text-xs text-slate-400 mb-1">Flow</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold text-red-400`}>
                            {telemetry?.haFlow.value.toFixed(0) || '--'}
                          </span>
                          <span className="text-slate-400 text-sm">ml/min</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Target: 300</p>
                      </div>
                    </div>
                    <div className="h-16 mt-3 min-w-0">
                      <ResponsiveContainer width="100%" height={64}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="haFlowGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartRed} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={chartRed} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="haFlow" stroke={chartRed} fill="url(#haFlowGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Temperature & Oxygenation Row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Temperature */}
                <Card className={`bg-slate-900/80 backdrop-blur border-2 ${getStatusBg(telemetry?.organTemp.status || 'normal')}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-orange-400" />
                      <span className="text-sm text-slate-400">Temperature</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Inlet</span>
                        <span className="text-orange-400 font-mono">
                          {telemetry?.inletTemp.value.toFixed(1) || '--'}°C
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Reservoir</span>
                        <span className="text-orange-400 font-mono">
                          {telemetry?.reservoirTemp.value.toFixed(1) || '--'}°C
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-orange-500/20">
                        <span className="text-sm text-orange-300 font-medium">Organ</span>
                        <span className="text-orange-300 font-mono font-bold text-xl">
                          {telemetry?.organTemp.value.toFixed(1) || '--'}°C
                        </span>
                      </div>
                    </div>
                    <Badge className="mt-2 bg-orange-500/20 text-orange-300 border-orange-500/50">
                      Target: 37°C
                    </Badge>
                  </CardContent>
                </Card>

                {/* Oxygenation - Split HA/PV */}
                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur col-span-2">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wind className="w-5 h-5 text-orange-400" />
                      <span className="text-sm text-slate-400">Oxygenation (Dual Oxygenator)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-xs text-red-300 mb-1">HA Oxygenator</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-red-400">60</span>
                          <span className="text-slate-400">% O2</span>
                        </div>
                        <p className="text-xs text-slate-500">+ 5% CO2</p>
                        <p className="text-xs text-slate-400 mt-2">
                          Post-DO: <span className="text-red-400 font-mono">{telemetry?.postOxygenatorDO.value.toFixed(0) || '--'}</span> mmHg
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <p className="text-xs text-orange-300 mb-1">PV Oxygenator</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-orange-400">30</span>
                          <span className="text-slate-400">% O2</span>
                        </div>
                        <p className="text-xs text-slate-500">+ 5% CO2</p>
                        <p className="text-xs text-slate-400 mt-2">
                          Pre-DO: <span className="text-orange-400 font-mono">{telemetry?.preOxygenatorDO.value.toFixed(0) || '--'}</span> mmHg
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status Row */}
              <div className="grid grid-cols-5 gap-3">
                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-slate-400">Pumps</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">HA</span>
                        <span className="text-red-400 font-mono">{telemetry?.haPumpRPM || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">PV</span>
                        <span className="text-orange-400 font-mono">{telemetry?.pvPumpRPM || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Waves className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-slate-400">Bubble</span>
                    </div>
                    <Badge className={`${
                      telemetry?.bubbleTrapStatus === 'OK' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                    }`}>
                      {telemetry?.bubbleTrapStatus || 'OK'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-slate-400">Reservoir</span>
                    </div>
                    <div className="text-xl font-bold text-orange-400 font-mono">
                      {telemetry?.reservoirVolume || 0}
                    </div>
                    <p className="text-xs text-slate-500">mL</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TestTube className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-400">Bile</span>
                    </div>
                    <div className="text-xl font-bold text-green-400 font-mono">
                      {telemetry?.bileFlow.toFixed(1) || 0}
                    </div>
                    <p className="text-xs text-slate-500">ml/hr</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-slate-400">Dialysis</span>
                    </div>
                    <Badge className={`${
                      telemetry?.dialysisActive 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {telemetry?.dialysisActive ? 'Active' : 'Off'}
                    </Badge>
                    {telemetry?.dialysisActive && (
                      <p className="text-xs text-slate-400 mt-1">{telemetry.dialysisFlow.toFixed(0)} ml/min</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gas" className="mt-2 space-y-3">
              {/* Gas Parameters from Final Gas Parameters Table */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400">Blood Gas Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <p className="text-xs text-slate-400 mb-1">pH</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${getStatusColor(telemetry?.gasParams.pH.status || 'normal')}`}>
                          {telemetry?.gasParams.pH.value.toFixed(2) || '--'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Target: 7.35-7.45</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-800/50">
                        <p className="text-xs text-slate-400">PaCO2</p>
                        <span className="text-lg font-bold text-orange-400 font-mono">
                          {telemetry?.gasParams.paCO2.value.toFixed(0) || '--'}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">mmHg</span>
                        <p className="text-xs text-slate-500">35-45</p>
                      </div>
                      <div className="p-2 rounded bg-slate-800/50">
                        <p className="text-xs text-slate-400">FiO2</p>
                        <span className="text-lg font-bold text-orange-400 font-mono">
                          {telemetry?.gasParams.fiO2 ? (telemetry.gasParams.fiO2 * 100).toFixed(0) : '--'}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">%</span>
                        <p className="text-xs text-slate-500">40-60%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400">PaO2 by Vessel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-xs text-red-300">Hepatic Artery PaO2</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-red-400 font-mono">
                          {telemetry?.gasParams.paO2_HA.value.toFixed(0) || '--'}
                        </span>
                        <span className="text-slate-400">mmHg</span>
                      </div>
                      <p className="text-xs text-slate-500">Target: 150-250</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <p className="text-xs text-orange-300">Portal Vein PaO2</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-orange-400 font-mono">
                          {telemetry?.gasParams.paO2_PV.value.toFixed(0) || '--'}
                        </span>
                        <span className="text-slate-400">mmHg</span>
                      </div>
                      <p className="text-xs text-slate-500">Target: 45-75</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400">Oxygen Saturation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">SO2 Arterial</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={telemetry?.gasParams.so2_arterial || 0} 
                          className="w-16 h-2 bg-slate-700 [&>div]:bg-red-500" 
                        />
                        <span className="text-red-400 font-mono w-12 text-right">
                          {telemetry?.gasParams.so2_arterial.toFixed(0) || '--'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">SO2 Portal</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={telemetry?.gasParams.so2_portal || 0} 
                          className="w-16 h-2 bg-slate-700 [&>div]:bg-orange-500" 
                        />
                        <span className="text-orange-400 font-mono w-12 text-right">
                          {telemetry?.gasParams.so2_portal.toFixed(0) || '--'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50">
                      <span className="text-sm text-slate-400">SO2 Venous</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={telemetry?.gasParams.so2_venous || 0} 
                          className="w-16 h-2 bg-slate-700 [&>div]:bg-purple-500" 
                        />
                        <span className="text-purple-400 font-mono w-12 text-right">
                          {telemetry?.gasParams.so2_venous.toFixed(0) || '--'}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 rounded bg-slate-800/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Hematocrit</span>
                        <span className="text-orange-400 font-mono">{telemetry?.gasParams.hematocrit.toFixed(0) || '--'}%</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-400">Hemoglobin</span>
                        <span className="text-orange-400 font-mono">{telemetry?.gasParams.hemoglobin.toFixed(1) || '--'} g/dL</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lft" className="mt-2 space-y-3">
              {/* Liver Function Tests */}
              <div className="grid grid-cols-5 gap-3">
                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Beaker className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Lactate</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-400 font-mono">
                      {telemetry?.liverFunction.lactate.toFixed(1) || '--'}
                    </div>
                    <p className="text-xs text-slate-500">mmol/L</p>
                    <Badge className={`mt-2 ${
                      (telemetry?.liverFunction.lactate || 0) < 2 
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {(telemetry?.liverFunction.lactate || 0) < 2 ? 'Normal' : 'Elevated'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">AST</p>
                    <div className="text-3xl font-bold text-orange-400 font-mono">
                      {telemetry?.liverFunction.ast.toFixed(0) || '--'}
                    </div>
                    <p className="text-xs text-slate-500">U/L</p>
                    <p className="text-xs text-slate-500 mt-1">Normal: {'<'}40</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">ALT</p>
                    <div className="text-3xl font-bold text-orange-400 font-mono">
                      {telemetry?.liverFunction.alt.toFixed(0) || '--'}
                    </div>
                    <p className="text-xs text-slate-500">U/L</p>
                    <p className="text-xs text-slate-500 mt-1">Normal: {'<'}40</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">Bilirubin</p>
                    <div className="text-3xl font-bold text-yellow-400 font-mono">
                      {telemetry?.liverFunction.bilirubin.toFixed(1) || '--'}
                    </div>
                    <p className="text-xs text-slate-500">mg/dL</p>
                    <p className="text-xs text-slate-500 mt-1">Normal: 0.1-1.2</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">FMN</p>
                    <div className="text-3xl font-bold text-cyan-400 font-mono">
                      {telemetry?.liverFunction.fmn.toFixed(0) || '--'}
                    </div>
                    <p className="text-xs text-slate-500">FU</p>
                    <p className="text-xs text-slate-500 mt-1">Mitochondrial</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bile Production & Glucose */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-900/80 border-green-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                      <TestTube className="w-4 h-4" /> Bile Production (Viability Indicator)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Current Rate</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-green-400 font-mono">
                            {telemetry?.bileFlow.toFixed(1) || '--'}
                          </span>
                          <span className="text-slate-400">ml/hr</span>
                        </div>
                        <Badge className={`mt-2 ${
                          (telemetry?.bileFlow || 0) > 10 
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {(telemetry?.bileFlow || 0) > 10 ? 'Good Production' : 'Low - Monitor'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Cumulative</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-green-400 font-mono">
                            {telemetry?.bileCumulative.toFixed(0) || '--'}
                          </span>
                          <span className="text-slate-400">mL</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-20 mt-4 min-w-0">
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="bileGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="bileFlow" stroke="#22c55e" fill="url(#bileGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-blue-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-400">Glucose & Lactate Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-xs text-blue-300">Glucose</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-400 font-mono">
                            {telemetry?.glucose.value.toFixed(0) || '--'}
                          </span>
                          <span className="text-slate-400 text-sm">mg/dL</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs text-amber-300">Lactate Trend</p>
                        <div className="flex items-center gap-2">
                          {(telemetry?.liverFunction.lactate || 2) < history[0]?.lactate ? (
                            <>
                              <TrendingUp className="w-5 h-5 text-emerald-400 rotate-180" />
                              <span className="text-emerald-400 text-sm">Clearing</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-5 h-5 text-amber-400" />
                              <span className="text-amber-400 text-sm">Rising</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="h-24 min-w-0">
                      <ResponsiveContainer width="100%" height={96}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <YAxis domain={[0, 4]} stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #f59e0b',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Line type="monotone" dataKey="lactate" stroke="#f59e0b" strokeWidth={2} dot={false} name="Lactate" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-2 space-y-3">
              {/* Comprehensive Trend Charts */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400">Pressure Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 min-w-0">
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="index" hide />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #f97316',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Line type="monotone" dataKey="pvPressure" stroke={chartOrange} strokeWidth={2} dot={false} name="PV Pressure" />
                          <Line type="monotone" dataKey="haPressure" stroke={chartRed} strokeWidth={2} dot={false} name="HA Pressure" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-2 justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-slate-400">PV Pressure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-slate-400">HA Pressure</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-400">Flow Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 min-w-0">
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="pvFlowTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartOrange} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={chartOrange} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="haFlowTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartRed} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={chartRed} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="index" hide />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #f97316',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Area type="monotone" dataKey="pvFlow" stroke={chartOrange} fill="url(#pvFlowTrend)" strokeWidth={2} dot={false} name="PV Flow" />
                          <Area type="monotone" dataKey="haFlow" stroke={chartRed} fill="url(#haFlowTrend)" strokeWidth={2} dot={false} name="HA Flow" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-2 justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-slate-400">PV Flow</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-slate-400">HA Flow</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-400">pH & Temperature Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 min-w-0">
                    <ResponsiveContainer width="100%" height={128}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="index" hide />
                        <YAxis yAxisId="temp" orientation="left" domain={[35, 39]} stroke="#f97316" fontSize={10} />
                        <YAxis yAxisId="ph" orientation="right" domain={[7.2, 7.6]} stroke="#22c55e" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #f97316',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <ReferenceLine yAxisId="temp" y={37} stroke="#f97316" strokeDasharray="5 5" />
                        <ReferenceLine yAxisId="ph" y={7.4} stroke="#22c55e" strokeDasharray="5 5" />
                        <Line yAxisId="temp" type="monotone" dataKey="organTemp" stroke={chartOrange} strokeWidth={2} dot={false} name="Temp (°C)" />
                        <Line yAxisId="ph" type="monotone" dataKey="pH" stroke="#22c55e" strokeWidth={2} dot={false} name="pH" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Alarms & Protocol */}
        <div className="col-span-3 space-y-3">
          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Alarms
                </span>
                <Badge variant="outline" className="border-orange-500/50 text-orange-300">
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

          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-400 flex items-center gap-2">
                <Info className="w-4 h-4" /> NMP Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                <p className="text-orange-300 font-medium">Dual Vessel Perfusion</p>
                <p className="text-slate-400 text-xs">Hepatic Artery + Portal Vein</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperature</span>
                  <span className="text-orange-300">37°C ± 0.5°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HA Pressure</span>
                  <span className="text-orange-300">60 mmHg (40-100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PV Pressure</span>
                  <span className="text-orange-300">10 mmHg (5-15)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HA Flow</span>
                  <span className="text-orange-300">300 ml/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PV Flow</span>
                  <span className="text-orange-300">1000-1200 ml/min</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700 mt-2">
                <p className="text-xs text-slate-400 mb-1">Gas Setup</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-1 rounded bg-red-500/10">
                    <span className="text-red-300">HA: 60% O2 + 5% CO2</span>
                  </div>
                  <div className="p-1 rounded bg-orange-500/10">
                    <span className="text-orange-300">PV: 30% O2 + 5% CO2</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-orange-500/30 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-400">Target Gas Values</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">pH</span>
                <span className="text-slate-300">7.35-7.45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PaCO2</span>
                <span className="text-slate-300">35-45 mmHg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PaO2 (HA)</span>
                <span className="text-slate-300">150-250 mmHg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PaO2 (PV)</span>
                <span className="text-slate-300">45-75 mmHg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">FiO2</span>
                <span className="text-slate-300">40-60%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
