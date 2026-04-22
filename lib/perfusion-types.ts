// BiTemp Perfusion System Types
// Based on Capstone G20 & G23 Parameters and Research

export type PerfusionMode = 'HOPE' | 'NMP' | 'TRANSITION' | 'IDLE'

export type AlarmLevel = 'normal' | 'warning' | 'critical'

export interface SensorReading {
  value: number
  unit: string
  min: number
  max: number
  optimalMin: number
  optimalMax: number
  timestamp: Date
  status: AlarmLevel
}

export interface GasParameters {
  pH: SensorReading
  paCO2: SensorReading     // mmHg
  paO2_HA: SensorReading   // mmHg - Hepatic Artery
  paO2_PV: SensorReading   // mmHg - Portal Vein
  fiO2: number             // 0.40-0.60
  so2_arterial: number     // %
  so2_portal: number       // %
  so2_venous: number       // %
  hematocrit: number       // %
  hemoglobin: number       // g/dL
}

export interface LiverFunctionTests {
  lactate: number          // mmol/L
  ast: number              // U/L (Aspartate Transaminase)
  alt: number              // U/L (Alanine Transaminase)
  bilirubin: number        // mg/dL
  fmn: number              // Flavin Mononucleotide (fluorescence units)
}

export interface TelemetryPacket {
  timestamp: Date
  mode: PerfusionMode
  elapsedTime: number // seconds since start
  runId: string
  
  // Portal Vein (HPV) - Pressure & Flow
  pvPressure: SensorReading    // mmHg - Target: 10 mmHg
  pvFlow: SensorReading        // ml/min - Target: 1000-1200 ml/min
  
  // Hepatic Artery (HA) - Pressure & Flow
  haPressure: SensorReading    // mmHg - Target: 60 mmHg
  haFlow: SensorReading        // ml/min - Target: 300 ml/min
  
  // Temperature Sensors (TS1-TS10 in system)
  inletTemp: SensorReading     // TS1 - Inlet temperature
  reservoirTemp: SensorReading // TS2 - Reservoir temperature
  organTemp: SensorReading     // TS3 - Organ chamber temperature
  heatExchangerIn: SensorReading  // TS4 - Heat exchanger inlet
  heatExchangerOut: SensorReading // TS5 - Heat exchanger outlet
  
  // Gas Parameters
  gasParams: GasParameters
  
  // Oxygenation - Dual Oxygenator System
  preOxygenatorDO: SensorReading   // Pre-oxygenator dissolved oxygen
  postOxygenatorDO: SensorReading  // Post-oxygenator dissolved oxygen
  haOxygenPercent: number          // HA O2% (60% for NMP)
  pvOxygenPercent: number          // PV O2% (30% for NMP)
  
  // Gas Blender Settings
  gasBlenderCO2: number            // L/min
  gasBlenderO2: number             // L/min or %
  co2Percent: number               // % (typically 5%)
  
  // Pumps (Multi-channel pump MCP)
  pvPumpRPM: number
  haPumpRPM: number
  
  // Bubble Trap & Detection
  bubbleTrapStatus: 'OK' | 'WARNING' | 'CRITICAL'
  bubbleCount: number
  bubbleDetected: boolean
  
  // Reservoir (PRSV)
  reservoirVolume: number          // mL
  reservoirWeight: number          // g (from W sensor)
  
  // Dialysis System (Fresenius Polysulfone membrane)
  dialysisActive: boolean
  dialysisFlow: number             // ml/min
  
  // Thermal Control
  coolingPercent: number           // % (HOPE mode)
  heatingPercent: number           // % (NMP mode)
  peltierPower: number             // W
  chamberHumidity: number          // % (DHT22 sensor)
  
  // Bile Production (BD - Bile Duct)
  bileFlow: number                 // ml/hr
  bileCumulative: number           // ml total
  
  // Glucose Sensor (GS1)
  glucose: SensorReading           // mg/dL
  
  // Liver Function Tests (sampled periodically)
  liverFunction: LiverFunctionTests
  
  // Safety Systems
  ascitesDetected: boolean
  systemPressure: SensorReading    // Overall system pressure
}

export interface Alarm {
  id: string
  timestamp: Date
  parameter: string
  level: AlarmLevel
  message: string
  value?: number
  acknowledged: boolean
}

export interface ManualEntry {
  id: string
  timestamp: Date
  type: 'abg' | 'pump_rpm' | 'gas_setting' | 'infusion' | 'note' | 'lft'
  operator: string
  values: Record<string, number | string>
}

// Sensor Component Mapping (from T1 Layout)
export const SENSOR_MAP = {
  // Temperature Sensors
  TS1: 'Inlet Temperature',
  TS2: 'Reservoir Temperature',
  TS3: 'Organ Chamber',
  TS4: 'Heat Exchanger Inlet',
  TS5: 'Heat Exchanger Outlet',
  TS6: 'HA Line',
  TS7: 'PV Line',
  TS8: 'Dialysis Circuit',
  TS9: 'Cooling Unit',
  TS10: 'Thermal Camera (MLX90640)',
  
  // Pressure Sensors (Honeywell ABP2)
  PS1: 'Hepatic Artery Pressure',
  PS2: 'Portal Vein Pressure',
  
  // Flow Sensors
  FS1: 'Portal Vein Flow',
  FS2: 'Hepatic Artery Flow',
  FS3: 'Bile Duct Flow',
  FS4: 'Dialysis Flow',
  
  // Glucose Sensor
  GS1: 'Perfusate Glucose',
  
  // Gas Sensors (CDI integration)
  O2: 'Oxygen Sensor',
  CO2: 'CO2 Sensor',
} as const

// Operating parameter ranges based on Capstone G20/G23 research
// HOPE Mode - Hypothermic Oxygenated Perfusion (4°C)
export const HOPE_PARAMS = {
  // Temperature: 4-10°C, optimal at 4°C
  temperature: { min: 0, max: 12, optimal: 4, unit: '°C' },
  
  // Portal Vein only in HOPE mode (single vessel perfusion)
  // PV Pressure: typically <3-5 mmHg from studies
  pvPressure: { min: 0, max: 5, optimal: 3, unit: 'mmHg' },
  
  // PV Flow: varies by liver weight, 0.05-0.15 mL/min/g
  // For ~1500g liver: 75-225 mL/min
  pvFlow: { min: 50, max: 250, optimal: 120, unit: 'ml/min' },
  
  // Oxygenation: High oxygen tension in HOPE
  // Uses 80-95% O2 in gas mix
  pO2: { min: 400, max: 600, optimal: 500, unit: 'mmHg' },
  
  // Cooling system - Peltier based
  cooling: { min: 60, max: 100, optimal: 80, unit: '%' },
  coolingPressure: { min: 400, max: 600, optimal: 500, unit: 'mmHg' },
} as const

// NMP Mode - Normothermic Machine Perfusion (37°C)
// Based on Capstone G20/G23 Final Gas Parameters
export const NMP_PARAMS = {
  // Temperature: 37°C ± 0.5°C (physiologic normothermic condition)
  temperature: { min: 36.5, max: 37.5, optimal: 37, unit: '°C' },
  
  // Hepatic Artery in NMP
  // HA Pressure: 60 mmHg target (research range 40-100 mmHg)
  haPressure: { min: 40, max: 100, optimal: 60, unit: 'mmHg' },
  // HA Flow: 300 ml/min target (research range 100-400 ml/min)
  haFlow: { min: 100, max: 400, optimal: 300, unit: 'ml/min' },
  
  // Portal Vein in NMP
  // PV Pressure: 10 mmHg target (research range 5-15 mmHg)
  pvPressure: { min: 5, max: 15, optimal: 10, unit: 'mmHg' },
  // PV Flow: 1000-1200 ml/min target (research range 550-1500 ml/min)
  pvFlow: { min: 800, max: 1500, optimal: 1200, unit: 'ml/min' },
  
  // Gas Parameters from Final Gas Parameters table
  pH: { min: 7.35, max: 7.45, optimal: 7.40, unit: '' },
  paCO2: { min: 35, max: 45, optimal: 40, unit: 'mmHg' },
  paO2_HA: { min: 150, max: 250, optimal: 200, unit: 'mmHg' },
  paO2_PV: { min: 45, max: 75, optimal: 60, unit: 'mmHg' },
  fiO2: { min: 0.40, max: 0.60, optimal: 0.50, unit: '' },
  
  // Oxygen Saturation targets
  so2_arterial: { min: 95, max: 100, optimal: 98, unit: '%' },
  so2_portal: { min: 85, max: 95, optimal: 92, unit: '%' },
  so2_venous: { min: 70, max: 90, optimal: 86, unit: '%' },
  
  // Gas Mixture Ratios (Split HA/PV setup)
  // HA: 60% O₂ + 5% CO₂
  // PV: 30% O₂ + 5% CO₂
  haO2Percent: { min: 55, max: 65, optimal: 60, unit: '%' },
  pvO2Percent: { min: 25, max: 35, optimal: 30, unit: '%' },
  co2Percent: { min: 4, max: 6, optimal: 5, unit: '%' },
} as const

// Transition Parameters (HOPE to NMP)
export const TRANSITION_PARAMS = {
  warmingRate: { max: 0.5, unit: '°C/min' }, // Gradual warming
  targetTemp: { value: 37, unit: '°C' },
  coolingCapacity: { min: 200, unit: 'W' },
} as const

// Liver Function Test Normal Ranges
export const LFT_PARAMS = {
  lactate: { min: 0, max: 2, unit: 'mmol/L' },
  ast: { min: 0, max: 40, unit: 'U/L' },
  alt: { min: 0, max: 40, unit: 'U/L' },
  bilirubin: { min: 0.1, max: 1.2, unit: 'mg/dL' },
} as const

// Hardware Component Info
export const HARDWARE = {
  // MCU: STM32 B-L475E-IOT01A + Riverdi 7" Touch Display
  mcu: 'STM32-L475E-IOT01A',
  display: 'Riverdi 7" STM32-Touch',
  
  // Thermal: Peltier cells with TMP102 sensors
  thermalSensor: 'TMP102 (I2C, ±0.5°C accuracy)',
  thermalCamera: 'MLX90640 (32x24 IR array)',
  humiditySensor: 'DHT22 (0-100% RH, ±2-5%)',
  
  // Pressure: Honeywell ABP2 Series
  pressureSensor: 'Honeywell ABP2 (I2C)',
  
  // Oxygenators
  oxygenator: 'Terumo CAPIOX FX / HILITE 2400 LT',
  
  // Dialysis
  dialysis: 'Fresenius Polysulfone (Ultraflux AV)',
  
  // Pumps
  pump: 'Multi-channel peristaltic pump (MCP)',
} as const
