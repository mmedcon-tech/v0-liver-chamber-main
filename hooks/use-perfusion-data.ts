'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TelemetryPacket, PerfusionMode, SensorReading, AlarmLevel, Alarm, GasParameters, LiverFunctionTests } from '@/lib/perfusion-types'

// Helper to create a sensor reading with status
function createReading(
  value: number,
  unit: string,
  min: number,
  max: number,
  optimalMin: number,
  optimalMax: number
): SensorReading {
  let status: AlarmLevel = 'normal'
  if (value < min || value > max) {
    status = 'critical'
  } else if (value < optimalMin || value > optimalMax) {
    status = 'warning'
  }
  
  return {
    value,
    unit,
    min,
    max,
    optimalMin,
    optimalMax,
    timestamp: new Date(),
    status,
  }
}

// Simulate small random variations
function vary(base: number, variance: number): number {
  return base + (Math.random() - 0.5) * 2 * variance
}

// Generate gas parameters based on mode
function generateGasParams(mode: PerfusionMode): GasParameters {
  if (mode === 'NMP') {
    return {
      pH: createReading(vary(7.40, 0.03), '', 7.35, 7.45, 7.38, 7.42),
      paCO2: createReading(vary(40, 3), 'mmHg', 35, 45, 38, 42),
      paO2_HA: createReading(vary(200, 20), 'mmHg', 150, 250, 180, 220),
      paO2_PV: createReading(vary(60, 8), 'mmHg', 45, 75, 50, 70),
      fiO2: vary(0.50, 0.05),
      so2_arterial: vary(98, 2),
      so2_portal: vary(92, 4),
      so2_venous: vary(86, 5),
      hematocrit: vary(30, 3),
      hemoglobin: vary(10, 1),
    }
  }
  
  // HOPE mode - higher oxygen tension
  return {
    pH: createReading(vary(7.35, 0.02), '', 7.30, 7.40, 7.33, 7.37),
    paCO2: createReading(vary(35, 3), 'mmHg', 30, 40, 32, 38),
    paO2_HA: createReading(0, 'mmHg', 0, 0, 0, 0), // Not used in HOPE
    paO2_PV: createReading(vary(500, 30), 'mmHg', 400, 600, 450, 550),
    fiO2: 0.80,
    so2_arterial: 99,
    so2_portal: 95,
    so2_venous: 90,
    hematocrit: 0,
    hemoglobin: 0,
  }
}

// Generate liver function tests (sampled values)
function generateLFT(mode: PerfusionMode, elapsedHours: number): LiverFunctionTests {
  // LFT values typically change over perfusion time
  // Good perfusion should show stable or decreasing AST/ALT
  const timeFactor = Math.min(elapsedHours / 12, 1) // Normalize over 12 hours
  
  if (mode === 'NMP') {
    return {
      lactate: Math.max(0.5, vary(2.0 - timeFactor * 0.8, 0.3)),
      ast: Math.max(20, vary(150 - timeFactor * 60, 20)),
      alt: Math.max(15, vary(100 - timeFactor * 40, 15)),
      bilirubin: vary(1.5 + timeFactor * 0.5, 0.3),
      fmn: vary(100 - timeFactor * 30, 10),
    }
  }
  
  // HOPE mode - minimal metabolic activity
  return {
    lactate: vary(0.8, 0.2),
    ast: vary(50, 10),
    alt: vary(35, 8),
    bilirubin: vary(0.8, 0.2),
    fmn: vary(80, 10),
  }
}

// Generate telemetry data based on current mode
function generateTelemetry(mode: PerfusionMode, elapsedSeconds: number, runId: string): TelemetryPacket {
  const timestamp = new Date()
  const elapsedHours = elapsedSeconds / 3600
  
  if (mode === 'HOPE') {
    return {
      timestamp,
      mode,
      elapsedTime: elapsedSeconds,
      runId,
      
      // Portal Vein - main perfusion path in HOPE
      // Target: 3 mmHg, 120 ml/min
      pvPressure: createReading(vary(3.2, 0.3), 'mmHg', 0, 5, 2, 4),
      pvFlow: createReading(vary(120, 10), 'ml/min', 50, 200, 80, 150),
      
      // HA not used in HOPE (single vessel perfusion)
      haPressure: createReading(0, 'mmHg', 0, 100, 0, 0),
      haFlow: createReading(0, 'ml/min', 0, 400, 0, 0),
      
      // Temperature - cold preservation (4°C target)
      inletTemp: createReading(vary(10.5, 0.5), '°C', 0, 15, 4, 12),
      reservoirTemp: createReading(vary(4.0, 0.3), '°C', 0, 15, 2, 6),
      organTemp: createReading(vary(4.2, 0.4), '°C', 0, 15, 2, 6),
      heatExchangerIn: createReading(vary(2.0, 0.2), '°C', 0, 10, 1, 4),
      heatExchangerOut: createReading(vary(4.0, 0.3), '°C', 0, 12, 2, 6),
      
      // Gas Parameters
      gasParams: generateGasParams(mode),
      
      // High oxygenation for HOPE (80% O2)
      preOxygenatorDO: createReading(vary(54, 5), 'mmHg', 40, 80, 50, 70),
      postOxygenatorDO: createReading(vary(438, 20), 'mmHg', 380, 520, 400, 480),
      haOxygenPercent: 0,
      pvOxygenPercent: 80,
      
      // Gas Blender
      gasBlenderCO2: 0.8,
      gasBlenderO2: 4.0,
      co2Percent: 5,
      
      // Pumps
      pvPumpRPM: 2400,
      haPumpRPM: 0,
      
      // Bubble trap
      bubbleTrapStatus: 'OK',
      bubbleCount: 0,
      bubbleDetected: false,
      
      // Reservoir
      reservoirVolume: 230,
      reservoirWeight: 1650,
      
      // Dialysis not active in HOPE
      dialysisActive: false,
      dialysisFlow: 0,
      
      // Cooling system active
      coolingPercent: 80,
      heatingPercent: 0,
      peltierPower: 120,
      chamberHumidity: vary(85, 5),
      
      // Bile (minimal in HOPE)
      bileFlow: vary(0.5, 0.2),
      bileCumulative: elapsedHours * 0.5,
      
      // Glucose
      glucose: createReading(vary(100, 10), 'mg/dL', 70, 180, 80, 140),
      
      // Liver Function
      liverFunction: generateLFT(mode, elapsedHours),
      
      // Safety
      ascitesDetected: false,
      systemPressure: createReading(vary(500, 30), 'mmHg', 400, 600, 450, 550),
    }
  } else if (mode === 'NMP') {
    return {
      timestamp,
      mode,
      elapsedTime: elapsedSeconds,
      runId,
      
      // Portal Vein - Target: 10 mmHg, 1000-1200 ml/min
      pvPressure: createReading(vary(7.5, 0.8), 'mmHg', 5, 15, 8, 12),
      pvFlow: createReading(vary(1100, 80), 'ml/min', 800, 1500, 1000, 1200),
      
      // Hepatic Artery - Target: 60 mmHg, 300 ml/min
      haPressure: createReading(vary(60, 5), 'mmHg', 40, 100, 55, 70),
      haFlow: createReading(vary(300, 25), 'ml/min', 100, 400, 250, 350),
      
      // Temperature - normothermic (37°C target)
      inletTemp: createReading(vary(36.8, 0.2), '°C', 35, 39, 36.5, 37.5),
      reservoirTemp: createReading(vary(36.9, 0.1), '°C', 35, 39, 36.5, 37.5),
      organTemp: createReading(vary(37.0, 0.2), '°C', 35, 39, 36.5, 37.5),
      heatExchangerIn: createReading(vary(38.0, 0.3), '°C', 36, 40, 37, 39),
      heatExchangerOut: createReading(vary(37.2, 0.2), '°C', 35, 39, 36.5, 37.5),
      
      // Gas Parameters (from Final Gas Parameters table)
      gasParams: generateGasParams(mode),
      
      // Oxygenation - Split HA/PV setup
      // HA: 60% O₂, PV: 30% O₂ (both 5% CO₂)
      preOxygenatorDO: createReading(vary(50, 5), 'mmHg', 40, 70, 45, 60),
      postOxygenatorDO: createReading(vary(180, 15), 'mmHg', 150, 250, 160, 220),
      haOxygenPercent: 60,
      pvOxygenPercent: 30,
      
      // Gas Blender
      gasBlenderCO2: vary(0.5, 0.1),
      gasBlenderO2: vary(2.0, 0.3),
      co2Percent: 5,
      
      // Pumps
      pvPumpRPM: 1400,
      haPumpRPM: 1200,
      
      // Bubble trap
      bubbleTrapStatus: Math.random() > 0.95 ? 'WARNING' : 'OK',
      bubbleCount: Math.random() > 0.98 ? 1 : 0,
      bubbleDetected: Math.random() > 0.99,
      
      // Reservoir
      reservoirVolume: 500,
      reservoirWeight: 2100,
      
      // Dialysis active in NMP
      dialysisActive: true,
      dialysisFlow: vary(200, 20),
      
      // Heating system active
      coolingPercent: 0,
      heatingPercent: vary(60, 10),
      peltierPower: vary(80, 15),
      chamberHumidity: vary(90, 3),
      
      // Bile production (indicator of liver function)
      bileFlow: vary(15, 5),
      bileCumulative: elapsedHours * 15,
      
      // Glucose
      glucose: createReading(vary(120, 15), 'mg/dL', 70, 180, 90, 150),
      
      // Liver Function
      liverFunction: generateLFT(mode, elapsedHours),
      
      // Safety
      ascitesDetected: false,
      systemPressure: createReading(vary(80, 10), 'mmHg', 50, 120, 60, 100),
    }
  }
  
  // IDLE or TRANSITION mode - return zeroed values
  const emptyGas: GasParameters = {
    pH: createReading(7.40, '', 7.35, 7.45, 7.38, 7.42),
    paCO2: createReading(40, 'mmHg', 35, 45, 38, 42),
    paO2_HA: createReading(0, 'mmHg', 0, 300, 0, 250),
    paO2_PV: createReading(0, 'mmHg', 0, 600, 0, 500),
    fiO2: 0,
    so2_arterial: 0,
    so2_portal: 0,
    so2_venous: 0,
    hematocrit: 0,
    hemoglobin: 0,
  }
  
  const emptyLFT: LiverFunctionTests = {
    lactate: 0,
    ast: 0,
    alt: 0,
    bilirubin: 0,
    fmn: 0,
  }
  
  return {
    timestamp,
    mode,
    elapsedTime: 0,
    runId: '',
    pvPressure: createReading(0, 'mmHg', 0, 15, 0, 10),
    pvFlow: createReading(0, 'ml/min', 0, 1500, 0, 1200),
    haPressure: createReading(0, 'mmHg', 0, 100, 0, 60),
    haFlow: createReading(0, 'ml/min', 0, 400, 0, 300),
    inletTemp: createReading(20, '°C', 0, 45, 4, 37.5),
    reservoirTemp: createReading(20, '°C', 0, 45, 4, 37.5),
    organTemp: createReading(20, '°C', 0, 45, 4, 37.5),
    heatExchangerIn: createReading(20, '°C', 0, 45, 4, 37.5),
    heatExchangerOut: createReading(20, '°C', 0, 45, 4, 37.5),
    gasParams: emptyGas,
    preOxygenatorDO: createReading(0, 'mmHg', 0, 100, 0, 80),
    postOxygenatorDO: createReading(0, 'mmHg', 0, 300, 0, 250),
    haOxygenPercent: 0,
    pvOxygenPercent: 0,
    gasBlenderCO2: 0,
    gasBlenderO2: 0,
    co2Percent: 0,
    pvPumpRPM: 0,
    haPumpRPM: 0,
    bubbleTrapStatus: 'OK',
    bubbleCount: 0,
    bubbleDetected: false,
    reservoirVolume: 0,
    reservoirWeight: 0,
    dialysisActive: false,
    dialysisFlow: 0,
    coolingPercent: 0,
    heatingPercent: 0,
    peltierPower: 0,
    chamberHumidity: 0,
    bileFlow: 0,
    bileCumulative: 0,
    glucose: createReading(0, 'mg/dL', 0, 200, 0, 150),
    liverFunction: emptyLFT,
    ascitesDetected: false,
    systemPressure: createReading(0, 'mmHg', 0, 200, 0, 100),
  }
}

export interface TelemetryHistory {
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
}

export function usePerfusionData() {
  const [mode, setMode] = useState<PerfusionMode>('IDLE')
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null)
  const [history, setHistory] = useState<TelemetryHistory[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [runId, setRunId] = useState('')
  const [flowRate, setFlowRate] = useState(6)
  const [pressureTargetEnabled, setPressureTargetEnabled] = useState(false)
  const [logDataEnabled, setLogDataEnabled] = useState(false)
  
  // Simulation states for testing scenarios
  const [simulateBubbles, setSimulateBubbles] = useState(false)
  const [simulateLowBileFlow, setSimulateLowBileFlow] = useState(false)
  const [simulateHighPressure, setSimulateHighPressure] = useState(false)
  const [simulateTempDeviation, setSimulateTempDeviation] = useState(false)
  const [isPriming, setIsPriming] = useState(false)
  const [primingProgress, setPrimingProgress] = useState(0)
  
  // Start/stop simulation
  const connect = useCallback(() => {
    setIsConnected(true)
  }, [])
  
  const disconnect = useCallback(() => {
    setIsConnected(false)
    setTelemetry(null)
    setStartTime(null)
  }, [])
  
  const startMode = useCallback((newMode: PerfusionMode) => {
    setMode(newMode)
    setStartTime(new Date())
    setRunId(`${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`)
    setIsConnected(true)
    setHistory([])
  }, [])
  
  const stopMode = useCallback(() => {
    setMode('IDLE')
    setStartTime(null)
  }, [])
  
  const changeMode = useCallback((newMode: PerfusionMode) => {
    setMode(newMode)
    if (newMode !== 'IDLE' && !startTime) {
      setStartTime(new Date())
      setRunId(`${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`)
    }
  }, [startTime])
  
  const acknowledgeAlarm = useCallback((alarmId: string) => {
    setAlarms(prev => prev.map(a => 
      a.id === alarmId ? { ...a, acknowledged: true } : a
    ))
  }, [])
  
  const clearAlarms = useCallback(() => {
    setAlarms(prev => prev.filter(a => !a.acknowledged))
  }, [])
  
  const clearBubbles = useCallback(() => {
    // Stop bubble simulation and clear bubble-related alarms
    setSimulateBubbles(false)
    
    // Update telemetry to clear bubbles
    setTelemetry(prev => {
      if (!prev) return prev
      return {
        ...prev,
        bubbleTrapStatus: 'OK',
        bubbleCount: 0,
        bubbleDetected: false,
      }
    })
    
    // Clear bubble alarms
    setAlarms(prev => prev.filter(a => a.parameter !== 'Bubbles'))
    
    // Add system notification
    setAlarms(prev => [...prev, {
      id: `clear-bubbles-${Date.now()}`,
      timestamp: new Date(),
      parameter: 'System',
      level: 'normal',
      message: 'Bubble trap cleared successfully',
      acknowledged: true,
    }])
  }, [])
  
  const primeCircuit = useCallback(() => {
    // Start priming simulation
    if (isPriming) return // Already priming
    
    setIsPriming(true)
    setPrimingProgress(0)
    
    // Add priming started notification
    setAlarms(prev => [...prev, {
      id: `priming-start-${Date.now()}`,
      timestamp: new Date(),
      parameter: 'System',
      level: 'warning',
      message: 'Circuit priming in progress...',
      acknowledged: false,
    }])
    
    // Simulate priming progress over 5 seconds
    let progress = 0
    const interval = setInterval(() => {
      progress += 20
      setPrimingProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        setIsPriming(false)
        setPrimingProgress(100)
        
        // Clear any existing bubbles when priming completes
        setSimulateBubbles(false)
        setTelemetry(prev => {
          if (!prev) return prev
          return {
            ...prev,
            bubbleTrapStatus: 'OK',
            bubbleCount: 0,
            bubbleDetected: false,
          }
        })
        
        // Add completion notification
        setAlarms(prev => [...prev.filter(a => !a.message.includes('priming in progress')), {
          id: `priming-complete-${Date.now()}`,
          timestamp: new Date(),
          parameter: 'System',
          level: 'normal',
          message: 'Circuit priming completed successfully',
          acknowledged: true,
        }])
        
        // Reset progress after a short delay
        setTimeout(() => setPrimingProgress(0), 2000)
      }
    }, 1000)
  }, [isPriming])
  
  const emergencyStop = useCallback(() => {
    setMode('IDLE')
    setIsConnected(false)
    setTelemetry(null)
    setStartTime(null)
    setAlarms(prev => [...prev, {
      id: `emergency-${Date.now()}`,
      timestamp: new Date(),
      parameter: 'System',
      level: 'critical',
      message: 'EMERGENCY STOP ACTIVATED',
      acknowledged: false,
    }])
  }, [])
  
  // Simulate 1Hz telemetry updates
  useEffect(() => {
    if (!isConnected) return
    
    const interval = setInterval(() => {
      const elapsedSeconds = startTime 
        ? Math.floor((Date.now() - startTime.getTime()) / 1000) 
        : 0
      
      let newTelemetry = generateTelemetry(mode, elapsedSeconds, runId)
      
      // Apply simulation overrides for testing
      if (simulateBubbles) {
        newTelemetry = {
          ...newTelemetry,
          bubbleTrapStatus: 'CRITICAL',
          bubbleCount: Math.floor(Math.random() * 5) + 3,
          bubbleDetected: true,
        }
      }
      
      if (simulateLowBileFlow && mode === 'NMP') {
        newTelemetry = {
          ...newTelemetry,
          bileFlow: vary(2, 0.5), // Low bile flow (normal is ~15)
        }
      }
      
      if (simulateHighPressure) {
        if (mode === 'HOPE') {
          newTelemetry = {
            ...newTelemetry,
            pvPressure: createReading(vary(8, 0.5), 'mmHg', 0, 5, 2, 4), // Above 5 mmHg limit
          }
        } else if (mode === 'NMP') {
          newTelemetry = {
            ...newTelemetry,
            haPressure: createReading(vary(110, 5), 'mmHg', 40, 100, 55, 70), // Above 100 mmHg limit
            pvPressure: createReading(vary(18, 1), 'mmHg', 5, 15, 8, 12), // Above 15 mmHg limit
          }
        }
      }
      
      if (simulateTempDeviation) {
        if (mode === 'HOPE') {
          newTelemetry = {
            ...newTelemetry,
            organTemp: createReading(vary(14, 1), '°C', 0, 15, 2, 6), // Too warm for HOPE
          }
        } else if (mode === 'NMP') {
          newTelemetry = {
            ...newTelemetry,
            organTemp: createReading(vary(34, 0.5), '°C', 35, 39, 36.5, 37.5), // Too cold for NMP
          }
        }
      }
      
      setTelemetry(newTelemetry)
      
      // Add to history (keep last 120 samples = 2 minutes)
      setHistory(prev => {
        const newEntry: TelemetryHistory = {
          timestamp: newTelemetry.timestamp,
          organTemp: newTelemetry.organTemp.value,
          pvPressure: newTelemetry.pvPressure.value,
          pvFlow: newTelemetry.pvFlow.value,
          haPressure: newTelemetry.haPressure.value,
          haFlow: newTelemetry.haFlow.value,
          postOxygenatorDO: newTelemetry.postOxygenatorDO.value,
          pH: newTelemetry.gasParams.pH.value,
          bileFlow: newTelemetry.bileFlow,
          lactate: newTelemetry.liverFunction.lactate,
        }
        const updated = [...prev, newEntry]
        return updated.slice(-120)
      })
      
      // Check for alarms
      const checkAlarm = (reading: SensorReading, paramName: string) => {
        if (reading.status === 'critical') {
          const alarmId = `${paramName}-${Date.now()}`
          setAlarms(prev => {
            const exists = prev.some(a => 
              a.parameter === paramName && 
              !a.acknowledged && 
              Date.now() - a.timestamp.getTime() < 10000
            )
            if (exists) return prev
            
            return [...prev, {
              id: alarmId,
              timestamp: new Date(),
              parameter: paramName,
              level: 'critical',
              message: `${paramName}: ${reading.value.toFixed(1)} ${reading.unit}`,
              value: reading.value,
              acknowledged: false,
            }]
          })
        }
      }
      
      // Check all critical parameters
      if (mode !== 'IDLE') {
        checkAlarm(newTelemetry.organTemp, 'Temperature')
        checkAlarm(newTelemetry.pvPressure, 'PV Pressure')
        checkAlarm(newTelemetry.gasParams.pH, 'pH')
        
        if (mode === 'NMP') {
          checkAlarm(newTelemetry.haPressure, 'HA Pressure')
          checkAlarm(newTelemetry.gasParams.paCO2, 'PaCO2')
        }
        
        // Bubble alarm
        if (newTelemetry.bubbleDetected) {
          setAlarms(prev => [...prev, {
            id: `bubble-${Date.now()}`,
            timestamp: new Date(),
            parameter: 'Bubbles',
            level: 'critical',
            message: 'Bubbles detected in circuit',
            acknowledged: false,
          }])
        }
        
        // Low bile flow alarm in NMP (indicator of poor liver function)
        if (mode === 'NMP' && newTelemetry.bileFlow < 5) {
          setAlarms(prev => {
            const exists = prev.some(a => 
              a.parameter === 'Bile Flow' && 
              !a.acknowledged && 
              Date.now() - a.timestamp.getTime() < 30000
            )
            if (exists) return prev
            
            return [...prev, {
              id: `bile-${Date.now()}`,
              timestamp: new Date(),
              parameter: 'Bile Flow',
              level: 'warning',
              message: `Low bile production: ${newTelemetry.bileFlow.toFixed(1)} ml/hr`,
              value: newTelemetry.bileFlow,
              acknowledged: false,
            }]
          })
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isConnected, mode, startTime, runId, simulateBubbles, simulateLowBileFlow, simulateHighPressure, simulateTempDeviation])
  
  return {
    mode,
    telemetry,
    history,
    alarms,
    isConnected,
    startTime,
    runId,
    flowRate,
    pressureTargetEnabled,
    logDataEnabled,
    connect,
    disconnect,
    startMode,
    stopMode,
    changeMode,
    acknowledgeAlarm,
    clearAlarms,
    clearBubbles,
    primeCircuit,
    emergencyStop,
    setFlowRate,
    setPressureTargetEnabled,
    setLogDataEnabled,
    // Simulation controls for testing
    simulateBubbles,
    setSimulateBubbles,
    simulateLowBileFlow,
    setSimulateLowBileFlow,
    simulateHighPressure,
    setSimulateHighPressure,
    simulateTempDeviation,
    setSimulateTempDeviation,
    isPriming,
    primingProgress,
  }
}
