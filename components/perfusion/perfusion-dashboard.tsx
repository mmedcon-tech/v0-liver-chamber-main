'use client'

import React from "react"

import { usePerfusionData } from '@/hooks/use-perfusion-data'
import { HOPEDashboard } from './hope-dashboard'
import { NMPDashboard } from './nmp-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Snowflake,
  Flame,
  Power,
  Activity,
  Cpu,
  Monitor,
  Thermometer,
  Wind,
  Droplets,
  Heart,
  ArrowRight,
  Zap,
} from 'lucide-react'

export function PerfusionDashboard() {
  const {
    mode,
    telemetry,
    history,
    alarms,
    isConnected,
    runId,
    flowRate,
    pressureTargetEnabled,
    logDataEnabled,
    startMode,
    stopMode,
    clearBubbles,
    primeCircuit,
    emergencyStop,
    setFlowRate,
    setPressureTargetEnabled,
    setLogDataEnabled,
    acknowledgeAlarm,
  } = usePerfusionData()

  const elapsedTime = telemetry?.elapsedTime || 0

  // Show HOPE Dashboard
  if (mode === 'HOPE') {
    return (
      <HOPEDashboard
        telemetry={telemetry}
        history={history}
        alarms={alarms}
        elapsedTime={elapsedTime}
        flowRate={flowRate}
        pressureTargetEnabled={pressureTargetEnabled}
        onFlowRateChange={setFlowRate}
        onPressureTargetChange={setPressureTargetEnabled}
        onStartNMP={() => startMode('NMP')}
        onPrimeCircuit={primeCircuit}
        onClearBubbles={clearBubbles}
        onEmergencyStop={emergencyStop}
        onAcknowledgeAlarm={acknowledgeAlarm}
      />
    )
  }

  // Show NMP Dashboard
  if (mode === 'NMP') {
    return (
      <NMPDashboard
        telemetry={telemetry}
        history={history}
        alarms={alarms}
        elapsedTime={elapsedTime}
        flowRate={flowRate}
        pressureTargetEnabled={pressureTargetEnabled}
        logDataEnabled={logDataEnabled}
        onFlowRateChange={setFlowRate}
        onPressureTargetChange={setPressureTargetEnabled}
        onLogDataChange={setLogDataEnabled}
        onStop={stopMode}
        onPrimeCircuit={primeCircuit}
        onClearBubbles={clearBubbles}
        onEmergencyStop={emergencyStop}
        onAcknowledgeAlarm={acknowledgeAlarm}
      />
    )
  }

  // IDLE State - Mode Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-orange-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-white to-orange-400 bg-clip-text text-transparent">
          BiTemp Perfusion System
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Dual-Mode Liver Perfusion Monitoring Dashboard
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-slate-500'}`}>
            {isConnected ? 'System Connected' : 'System Offline'}
          </span>
        </div>
      </header>

      {/* Mode Selection Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-8 mb-12">
        {/* HOPE Mode Card */}
        <Card className="bg-gradient-to-br from-cyan-950/50 to-slate-900 border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 group cursor-pointer"
              onClick={() => startMode('HOPE')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <Snowflake className="w-7 h-7 text-white" />
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50 text-lg px-4 py-1">
                4°C
              </Badge>
            </div>
            <CardTitle className="text-2xl text-cyan-300 mt-4">HOPE Mode</CardTitle>
            <p className="text-slate-400">Hypothermic Oxygenated Perfusion</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm text-cyan-200 font-medium mb-2">Cold Preservation Protocol</p>
              <p className="text-xs text-slate-400">
                Single vessel perfusion through Portal Vein only. Maintains organ at 4°C with high oxygen tension for extended preservation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Temperature:</span>
                <span className="text-cyan-300">4°C (0-12°C range)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">PV Pressure:</span>
                <span className="text-cyan-300">{'<'}5 mmHg</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">PV Flow:</span>
                <span className="text-cyan-300">80-150 ml/min</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Oxygen:</span>
                <span className="text-cyan-300">80-95% O2, pO2 400-600 mmHg</span>
              </div>
            </div>

            <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
              <Snowflake className="w-4 h-4 mr-2" />
              Start HOPE Mode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* NMP Mode Card */}
        <Card className="bg-gradient-to-br from-orange-950/50 to-slate-900 border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 group cursor-pointer"
              onClick={() => startMode('NMP')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50 text-lg px-4 py-1">
                37°C
              </Badge>
            </div>
            <CardTitle className="text-2xl text-orange-300 mt-4">NMP Mode</CardTitle>
            <p className="text-slate-400">Normothermic Machine Perfusion</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-orange-200 font-medium mb-2">Physiologic Perfusion Protocol</p>
              <p className="text-xs text-slate-400">
                Dual vessel perfusion through Hepatic Artery and Portal Vein. Maintains organ at 37°C with physiologic conditions for viability assessment.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400">Temperature:</span>
                <span className="text-orange-300">37°C ± 0.5°C</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-slate-400">HA Pressure:</span>
                <span className="text-orange-300">60 mmHg (40-100)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Droplets className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400">PV Pressure:</span>
                <span className="text-orange-300">10 mmHg (5-15)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Wind className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400">Gas Setup:</span>
                <span className="text-orange-300">HA 60% / PV 30% O2</span>
              </div>
            </div>

            <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all">
              <Flame className="w-4 h-4 mr-2" />
              Start NMP Mode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <div className="max-w-5xl mx-auto">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">MCU</p>
                <p className="text-sm text-slate-300">STM32-L475E-IOT01A</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Display</p>
                <p className="text-sm text-slate-300">Riverdi 7" STM32-Touch</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Oxygenator</p>
                <p className="text-sm text-slate-300">Terumo CAPIOX / HILITE</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Dialysis</p>
                <p className="text-sm text-slate-300">Fresenius Polysulfone</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="grid grid-cols-6 gap-4 text-xs">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-slate-500">10x Temp</p>
                  <p className="text-slate-400">TMP102</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Gauge className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-slate-500">2x Pressure</p>
                  <p className="text-slate-400">ABP2</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Activity className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-slate-500">4x Flow</p>
                  <p className="text-slate-400">Ultrasonic</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Wind className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-slate-500">O2/CO2</p>
                  <p className="text-slate-400">CDI</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Monitor className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-slate-500">IR Camera</p>
                  <p className="text-slate-400">MLX90640</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-slate-500">Glucose</p>
                  <p className="text-slate-400">GS1</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protocol Reference */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card className="bg-cyan-950/30 border-cyan-500/20">
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium text-cyan-400 mb-2">HOPE Key Parameters</h3>
              <div className="text-xs space-y-1 text-slate-400">
                <p>Single vessel (Portal Vein only)</p>
                <p>Temperature: 0-12°C optimal at 4°C</p>
                <p>PV Flow: 0.05-0.15 mL/min/g liver weight</p>
                <p>High oxygen: 80-95% O2, pO2 400-600 mmHg</p>
                <p>Perfusate: UW/Belzer solution based</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-950/30 border-orange-500/20">
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium text-orange-400 mb-2">NMP Key Parameters</h3>
              <div className="text-xs space-y-1 text-slate-400">
                <p>Dual vessel (HA + PV)</p>
                <p>Temperature: 37°C ± 0.5°C</p>
                <p>pH: 7.35-7.45, PaCO2: 35-45 mmHg</p>
                <p>HA: 60% O2, PaO2 150-250 mmHg</p>
                <p>PV: 30% O2, PaO2 45-75 mmHg</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Gauge(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  )
}
