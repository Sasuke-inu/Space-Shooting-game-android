// ------------------------------------------------------------------ //
//                    Performance Monitoring Types
// ------------------------------------------------------------------ //

/** Performance metrics snapshot */
export interface PerformanceMetrics {
  fps: number                 // Current frames per second
  avgFps: number             // Average FPS over measurement window
  minFps: number             // Minimum FPS recorded
  maxFps: number             // Maximum FPS recorded
  frameTime: number          // Current frame time in ms
  avgFrameTime: number       // Average frame time in ms
  deltaTime: number          // Time since last frame in seconds
  timestamp: number          // When metrics were captured
}

/** Memory usage metrics */
export interface MemoryMetrics {
  used: number               // Memory used in MB
  total: number              // Total memory available in MB
  percentage: number         // Memory usage percentage (0-100)
  timestamp: number          // When metrics were captured
}

/** Performance warning levels */
export type PerformanceWarningLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'

/** Performance warning event */
export interface PerformanceWarning {
  level: PerformanceWarningLevel
  type: 'fps' | 'memory' | 'frameTime'
  message: string
  value: number              // Current problematic value
  threshold: number          // Threshold that was exceeded
  timestamp: number
}

/** Quality preset levels */
export type QualityLevel = 'low' | 'medium' | 'high'

/** Quality settings configuration */
export interface QualitySettings {
  level: QualityLevel
  particleMultiplier: number    // Particle count multiplier (0.0-1.0)
  maxParticles: number          // Max particles allowed
  enableGlow: boolean           // Enable glow effects
  enableTrails: boolean         // Enable particle trails
  enableScreenShake: boolean    // Enable screen shake
  renderDistance: number        // Max render distance multiplier
}

/** Performance thresholds for warnings */
export interface PerformanceThresholds {
  targetFps: number          // Target FPS (usually 60)
  minFps: number             // FPS below this triggers warning
  maxFrameTime: number       // Frame time above this triggers warning (ms)
  maxMemory: number          // Memory above this triggers warning (MB)
  criticalMemory: number     // Critical memory threshold (MB)
}

/** Performance monitoring configuration */
export interface PerformanceConfig {
  enabled: boolean           // Enable performance monitoring
  showFpsCounter: boolean    // Show FPS counter on screen
  showMemoryUsage: boolean   // Show memory usage on screen
  enableWarnings: boolean    // Enable performance warnings
  logInterval: number        // How often to log metrics (ms)
  metricsHistorySize: number // How many metrics snapshots to keep
}

/** Performance statistics for reporting */
export interface PerformanceStats {
  sessionDuration: number    // Total session time in seconds
  avgFps: number             // Average FPS over session
  minFps: number             // Minimum FPS recorded
  maxFps: number             // Maximum FPS recorded
  frameDrops: number         // Number of significant frame drops
  warnings: number           // Total warnings triggered
  avgMemory: number          // Average memory usage (MB)
  peakMemory: number         // Peak memory usage (MB)
}

// ------------------------------------------------------------------ //
//                    Quality Presets
// ------------------------------------------------------------------ //

/** Quality preset configurations */
export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    level: 'low',
    particleMultiplier: 0.25,
    maxParticles: 50,
    enableGlow: false,
    enableTrails: false,
    enableScreenShake: true,
    renderDistance: 0.8,
  },
  medium: {
    level: 'medium',
    particleMultiplier: 0.5,
    maxParticles: 150,
    enableGlow: true,
    enableTrails: false,
    enableScreenShake: true,
    renderDistance: 1.0,
  },
  high: {
    level: 'high',
    particleMultiplier: 1.0,
    maxParticles: 300,
    enableGlow: true,
    enableTrails: true,
    enableScreenShake: true,
    renderDistance: 1.0,
  },
}

/** Default performance thresholds */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  targetFps: 60,
  minFps: 45,
  maxFrameTime: 20,      // 20ms = 50fps
  maxMemory: 200,        // 200MB
  criticalMemory: 250,   // 250MB
}

/** Default performance monitoring configuration */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  showFpsCounter: false,  // Off by default, can be toggled in settings
  showMemoryUsage: false,
  enableWarnings: true,
  logInterval: 5000,      // Log every 5 seconds
  metricsHistorySize: 60, // Keep last 60 samples (5 minutes at 5s intervals)
}

// ------------------------------------------------------------------ //
//                    Performance Event Types
// ------------------------------------------------------------------ //

/** Performance event types for logging and debugging */
export type PerformanceEventType =
  | 'fps_drop'           // FPS dropped below threshold
  | 'memory_warning'     // Memory usage exceeded threshold
  | 'memory_critical'    // Memory usage critical
  | 'frame_skip'         // Frame took too long to render
  | 'quality_change'     // Quality level changed
  | 'monitoring_start'   // Performance monitoring started
  | 'monitoring_stop'    // Performance monitoring stopped

/** Performance event for logging */
export interface PerformanceEvent {
  type: PerformanceEventType
  timestamp: number
  data?: Record<string, unknown>  // Additional event-specific data
}
