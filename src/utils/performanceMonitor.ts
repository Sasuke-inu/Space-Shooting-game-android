import { useCallback, useRef, useEffect } from "react"
import type {
  PerformanceMetrics,
  MemoryMetrics,
  PerformanceWarning,
  PerformanceConfig,
  PerformanceThresholds,
  PerformanceStats,
  PerformanceEvent,
  PerformanceWarningLevel,
} from "../types/performance"
import {
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_PERFORMANCE_THRESHOLDS,
} from "../types/performance"

// ------------------------------------------------------------------ //
//                    Performance Monitor Hook
// ------------------------------------------------------------------ //

/**
 * Performance monitoring hook for tracking FPS and memory usage
 *
 * Usage:
 * ```tsx
 * const { startFrame, endFrame, getMetrics, getMemoryMetrics } = usePerformanceMonitor()
 *
 * // In game loop:
 * startFrame()
 * // ... render game ...
 * endFrame()
 *
 * // Display metrics:
 * const metrics = getMetrics()
 * console.log(`FPS: ${metrics.fps}`)
 * ```
 */
export const usePerformanceMonitor = (
  config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG,
  thresholds: PerformanceThresholds = DEFAULT_PERFORMANCE_THRESHOLDS
) => {
  // Frame timing tracking
  const lastFrameTime = useRef<number>(0)
  const frameStartTime = useRef<number>(0)
  const frameTimes = useRef<number[]>([])
  const fpsHistory = useRef<number[]>([])

  // Metrics state
  const currentMetrics = useRef<PerformanceMetrics>({
    fps: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameTime: 0,
    avgFrameTime: 0,
    deltaTime: 0,
    timestamp: Date.now(),
  })

  // Memory tracking
  const memoryHistory = useRef<MemoryMetrics[]>([])
  const lastMemoryCheck = useRef<number>(0)

  // Performance statistics
  const stats = useRef<PerformanceStats>({
    sessionDuration: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameDrops: 0,
    warnings: 0,
    avgMemory: 0,
    peakMemory: 0,
  })

  // Warning tracking
  const warnings = useRef<PerformanceWarning[]>([])
  const events = useRef<PerformanceEvent[]>([])
  const sessionStartTime = useRef<number>(Date.now())

  /**
   * Mark the start of a new frame
   */
  const startFrame = useCallback(() => {
    if (!config.enabled) return

    const now = performance.now()
    frameStartTime.current = now

    if (lastFrameTime.current > 0) {
      const deltaMs = now - lastFrameTime.current
      const deltaSeconds = deltaMs / 1000
      const fps = deltaMs > 0 ? 1000 / deltaMs : 0

      // Update frame times history (keep last 60 frames for averaging)
      frameTimes.current.push(deltaMs)
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift()
      }

      // Update FPS history
      fpsHistory.current.push(fps)
      if (fpsHistory.current.length > 60) {
        fpsHistory.current.shift()
      }

      // Calculate averages
      const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
      const avgFps = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
      const minFps = Math.min(...fpsHistory.current)
      const maxFps = Math.max(...fpsHistory.current)

      // Update current metrics
      currentMetrics.current = {
        fps: Math.round(fps),
        avgFps: Math.round(avgFps),
        minFps: Math.round(minFps),
        maxFps: Math.round(maxFps),
        frameTime: deltaMs,
        avgFrameTime,
        deltaTime: deltaSeconds,
        timestamp: Date.now(),
      }

      // Update session stats
      stats.current.minFps = Math.min(stats.current.minFps, fps)
      stats.current.maxFps = Math.max(stats.current.maxFps, fps)
      stats.current.avgFps = avgFps
      stats.current.sessionDuration = (Date.now() - sessionStartTime.current) / 1000

      // Check for performance warnings
      if (config.enableWarnings) {
        checkPerformanceWarnings(fps, deltaMs)
      }
    }

    lastFrameTime.current = now
  }, [config.enabled, config.enableWarnings])

  /**
   * Mark the end of a frame (optional, for more accurate frame time measurement)
   */
  const endFrame = useCallback(() => {
    if (!config.enabled) return

    const now = performance.now()
    const frameTime = now - frameStartTime.current

    // Check for long frames
    if (frameTime > thresholds.maxFrameTime && config.enableWarnings) {
      stats.current.frameDrops++

      const warning: PerformanceWarning = {
        level: frameTime > thresholds.maxFrameTime * 2 ? 'high' : 'medium',
        type: 'frameTime',
        message: `Frame took ${frameTime.toFixed(1)}ms (target: ${thresholds.maxFrameTime}ms)`,
        value: frameTime,
        threshold: thresholds.maxFrameTime,
        timestamp: Date.now(),
      }

      warnings.current.push(warning)
      if (warnings.current.length > config.metricsHistorySize) {
        warnings.current.shift()
      }

      logEvent({
        type: 'frame_skip',
        timestamp: Date.now(),
        data: { frameTime, threshold: thresholds.maxFrameTime },
      })
    }
  }, [config.enabled, config.enableWarnings, config.metricsHistorySize, thresholds.maxFrameTime])

  /**
   * Get current memory metrics (estimates on React Native)
   */
  const getMemoryMetrics = useCallback((): MemoryMetrics => {
    const now = Date.now()

    // Only check memory periodically to reduce overhead
    if (now - lastMemoryCheck.current < 1000) {
      return memoryHistory.current[memoryHistory.current.length - 1] || {
        used: 0,
        total: 0,
        percentage: 0,
        timestamp: now,
      }
    }

    lastMemoryCheck.current = now

    // React Native doesn't expose performance.memory
    // We'll use a placeholder that can be enhanced with native modules
    let used = 0
    let total = 0

    // Check if we're in a browser environment with performance.memory
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
      used = memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
      total = memory.totalJSHeapSize / (1024 * 1024)
    }

    const percentage = total > 0 ? (used / total) * 100 : 0

    const metrics: MemoryMetrics = {
      used,
      total,
      percentage,
      timestamp: now,
    }

    // Update memory history
    memoryHistory.current.push(metrics)
    if (memoryHistory.current.length > config.metricsHistorySize) {
      memoryHistory.current.shift()
    }

    // Update session stats
    const avgMemory = memoryHistory.current.reduce((sum, m) => sum + m.used, 0) / memoryHistory.current.length
    stats.current.avgMemory = avgMemory
    stats.current.peakMemory = Math.max(stats.current.peakMemory, used)

    // Check memory warnings
    if (config.enableWarnings) {
      checkMemoryWarnings(used)
    }

    return metrics
  }, [config.enabled, config.enableWarnings, config.metricsHistorySize])

  /**
   * Check for FPS and frame time warnings
   */
  const checkPerformanceWarnings = useCallback((fps: number, frameTime: number) => {
    let warningLevel: PerformanceWarningLevel = 'none'
    let message = ''

    // Check FPS
    if (fps < thresholds.minFps) {
      const fpsDrop = thresholds.targetFps - fps

      if (fps < 30) {
        warningLevel = 'critical'
      } else if (fps < 40) {
        warningLevel = 'high'
      } else if (fps < thresholds.minFps) {
        warningLevel = 'medium'
      }

      if (warningLevel !== 'none') {
        message = `FPS dropped to ${Math.round(fps)} (target: ${thresholds.targetFps})`

        const warning: PerformanceWarning = {
          level: warningLevel,
          type: 'fps',
          message,
          value: fps,
          threshold: thresholds.minFps,
          timestamp: Date.now(),
        }

        warnings.current.push(warning)
        if (warnings.current.length > config.metricsHistorySize) {
          warnings.current.shift()
        }

        stats.current.warnings++

        logEvent({
          type: 'fps_drop',
          timestamp: Date.now(),
          data: { fps, threshold: thresholds.minFps, level: warningLevel },
        })
      }
    }
  }, [config.metricsHistorySize, thresholds])

  /**
   * Check for memory warnings
   */
  const checkMemoryWarnings = useCallback((used: number) => {
    let warningLevel: PerformanceWarningLevel = 'none'
    let message = ''

    if (used >= thresholds.criticalMemory) {
      warningLevel = 'critical'
      message = `Critical memory usage: ${used.toFixed(0)}MB (limit: ${thresholds.criticalMemory}MB)`
    } else if (used >= thresholds.maxMemory) {
      warningLevel = 'high'
      message = `High memory usage: ${used.toFixed(0)}MB (target: ${thresholds.maxMemory}MB)`
    } else if (used >= thresholds.maxMemory * 0.8) {
      warningLevel = 'medium'
      message = `Memory usage elevated: ${used.toFixed(0)}MB (target: ${thresholds.maxMemory}MB)`
    }

    if (warningLevel !== 'none') {
      const warning: PerformanceWarning = {
        level: warningLevel,
        type: 'memory',
        message,
        value: used,
        threshold: thresholds.maxMemory,
        timestamp: Date.now(),
      }

      warnings.current.push(warning)
      if (warnings.current.length > config.metricsHistorySize) {
        warnings.current.shift()
      }

      stats.current.warnings++

      const eventType = warningLevel === 'critical' ? 'memory_critical' : 'memory_warning'
      logEvent({
        type: eventType,
        timestamp: Date.now(),
        data: { used, threshold: thresholds.maxMemory, level: warningLevel },
      })
    }
  }, [config.metricsHistorySize, thresholds])

  /**
   * Log a performance event
   */
  const logEvent = useCallback((event: PerformanceEvent) => {
    events.current.push(event)
    if (events.current.length > config.metricsHistorySize * 2) {
      events.current.shift()
    }

    // Log to console in development if enabled
    if (__DEV__ && config.enableWarnings) {
      const eventData = event.data ? JSON.stringify(event.data) : ''
      console.log(`[Performance] ${event.type} ${eventData}`)
    }
  }, [config.metricsHistorySize, config.enableWarnings])

  /**
   * Get current performance metrics
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...currentMetrics.current }
  }, [])

  /**
   * Get recent performance warnings
   */
  const getWarnings = useCallback((): PerformanceWarning[] => {
    return [...warnings.current]
  }, [])

  /**
   * Get performance statistics
   */
  const getStats = useCallback((): PerformanceStats => {
    return { ...stats.current }
  }, [])

  /**
   * Get recent performance events
   */
  const getEvents = useCallback((): PerformanceEvent[] => {
    return [...events.current]
  }, [])

  /**
   * Reset all metrics and statistics
   */
  const reset = useCallback(() => {
    lastFrameTime.current = 0
    frameStartTime.current = 0
    frameTimes.current = []
    fpsHistory.current = []
    memoryHistory.current = []
    warnings.current = []
    events.current = []
    sessionStartTime.current = Date.now()
    lastMemoryCheck.current = 0

    currentMetrics.current = {
      fps: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameTime: 0,
      avgFrameTime: 0,
      deltaTime: 0,
      timestamp: Date.now(),
    }

    stats.current = {
      sessionDuration: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameDrops: 0,
      warnings: 0,
      avgMemory: 0,
      peakMemory: 0,
    }

    logEvent({
      type: 'monitoring_start',
      timestamp: Date.now(),
    })
  }, [logEvent])

  // Initialize on mount
  useEffect(() => {
    if (config.enabled) {
      reset()
    }

    return () => {
      if (config.enabled) {
        logEvent({
          type: 'monitoring_stop',
          timestamp: Date.now(),
          data: { stats: stats.current },
        })
      }
    }
  }, [config.enabled, reset, logEvent])

  return {
    startFrame,
    endFrame,
    getMetrics,
    getMemoryMetrics,
    getWarnings,
    getStats,
    getEvents,
    reset,
  }
}

// ------------------------------------------------------------------ //
//                    Standalone Performance Monitor
// ------------------------------------------------------------------ //

/**
 * Standalone performance monitor class for use outside of React components
 * Useful for integration into game loop or service workers
 */
export class PerformanceMonitor {
  private config: PerformanceConfig
  private thresholds: PerformanceThresholds
  private lastFrameTime = 0
  private frameStartTime = 0
  private frameTimes: number[] = []
  private fpsHistory: number[] = []
  private memoryHistory: MemoryMetrics[] = []
  private lastMemoryCheck = 0
  private warnings: PerformanceWarning[] = []
  private events: PerformanceEvent[] = []
  private sessionStartTime = Date.now()

  private currentMetrics: PerformanceMetrics = {
    fps: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameTime: 0,
    avgFrameTime: 0,
    deltaTime: 0,
    timestamp: Date.now(),
  }

  private stats: PerformanceStats = {
    sessionDuration: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameDrops: 0,
    warnings: 0,
    avgMemory: 0,
    peakMemory: 0,
  }

  constructor(
    config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG,
    thresholds: PerformanceThresholds = DEFAULT_PERFORMANCE_THRESHOLDS
  ) {
    this.config = config
    this.thresholds = thresholds
    this.logEvent({ type: 'monitoring_start', timestamp: Date.now() })
  }

  startFrame(): void {
    if (!this.config.enabled) return

    const now = performance.now()
    this.frameStartTime = now

    if (this.lastFrameTime > 0) {
      const deltaMs = now - this.lastFrameTime
      const deltaSeconds = deltaMs / 1000
      const fps = deltaMs > 0 ? 1000 / deltaMs : 0

      this.frameTimes.push(deltaMs)
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift()
      }

      this.fpsHistory.push(fps)
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }

      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      const minFps = Math.min(...this.fpsHistory)
      const maxFps = Math.max(...this.fpsHistory)

      this.currentMetrics = {
        fps: Math.round(fps),
        avgFps: Math.round(avgFps),
        minFps: Math.round(minFps),
        maxFps: Math.round(maxFps),
        frameTime: deltaMs,
        avgFrameTime,
        deltaTime: deltaSeconds,
        timestamp: Date.now(),
      }

      this.stats.minFps = Math.min(this.stats.minFps, fps)
      this.stats.maxFps = Math.max(this.stats.maxFps, fps)
      this.stats.avgFps = avgFps
      this.stats.sessionDuration = (Date.now() - this.sessionStartTime) / 1000

      if (this.config.enableWarnings) {
        this.checkPerformanceWarnings(fps, deltaMs)
      }
    }

    this.lastFrameTime = now
  }

  endFrame(): void {
    if (!this.config.enabled) return

    const now = performance.now()
    const frameTime = now - this.frameStartTime

    if (frameTime > this.thresholds.maxFrameTime && this.config.enableWarnings) {
      this.stats.frameDrops++

      const warning: PerformanceWarning = {
        level: frameTime > this.thresholds.maxFrameTime * 2 ? 'high' : 'medium',
        type: 'frameTime',
        message: `Frame took ${frameTime.toFixed(1)}ms (target: ${this.thresholds.maxFrameTime}ms)`,
        value: frameTime,
        threshold: this.thresholds.maxFrameTime,
        timestamp: Date.now(),
      }

      this.warnings.push(warning)
      if (this.warnings.length > this.config.metricsHistorySize) {
        this.warnings.shift()
      }

      this.logEvent({
        type: 'frame_skip',
        timestamp: Date.now(),
        data: { frameTime, threshold: this.thresholds.maxFrameTime },
      })
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics }
  }

  getMemoryMetrics(): MemoryMetrics {
    const now = Date.now()

    if (now - this.lastMemoryCheck < 1000) {
      return this.memoryHistory[this.memoryHistory.length - 1] || {
        used: 0,
        total: 0,
        percentage: 0,
        timestamp: now,
      }
    }

    this.lastMemoryCheck = now

    let used = 0
    let total = 0

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
      used = memory.usedJSHeapSize / (1024 * 1024)
      total = memory.totalJSHeapSize / (1024 * 1024)
    }

    const percentage = total > 0 ? (used / total) * 100 : 0

    const metrics: MemoryMetrics = {
      used,
      total,
      percentage,
      timestamp: now,
    }

    this.memoryHistory.push(metrics)
    if (this.memoryHistory.length > this.config.metricsHistorySize) {
      this.memoryHistory.shift()
    }

    const avgMemory = this.memoryHistory.reduce((sum, m) => sum + m.used, 0) / this.memoryHistory.length
    this.stats.avgMemory = avgMemory
    this.stats.peakMemory = Math.max(this.stats.peakMemory, used)

    if (this.config.enableWarnings) {
      this.checkMemoryWarnings(used)
    }

    return metrics
  }

  getWarnings(): PerformanceWarning[] {
    return [...this.warnings]
  }

  getStats(): PerformanceStats {
    return { ...this.stats }
  }

  getEvents(): PerformanceEvent[] {
    return [...this.events]
  }

  reset(): void {
    this.lastFrameTime = 0
    this.frameStartTime = 0
    this.frameTimes = []
    this.fpsHistory = []
    this.memoryHistory = []
    this.warnings = []
    this.events = []
    this.sessionStartTime = Date.now()
    this.lastMemoryCheck = 0

    this.currentMetrics = {
      fps: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameTime: 0,
      avgFrameTime: 0,
      deltaTime: 0,
      timestamp: Date.now(),
    }

    this.stats = {
      sessionDuration: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameDrops: 0,
      warnings: 0,
      avgMemory: 0,
      peakMemory: 0,
    }

    this.logEvent({ type: 'monitoring_start', timestamp: Date.now() })
  }

  private checkPerformanceWarnings(fps: number, frameTime: number): void {
    let warningLevel: PerformanceWarningLevel = 'none'
    let message = ''

    if (fps < this.thresholds.minFps) {
      if (fps < 30) {
        warningLevel = 'critical'
      } else if (fps < 40) {
        warningLevel = 'high'
      } else if (fps < this.thresholds.minFps) {
        warningLevel = 'medium'
      }

      if (warningLevel !== 'none') {
        message = `FPS dropped to ${Math.round(fps)} (target: ${this.thresholds.targetFps})`

        const warning: PerformanceWarning = {
          level: warningLevel,
          type: 'fps',
          message,
          value: fps,
          threshold: this.thresholds.minFps,
          timestamp: Date.now(),
        }

        this.warnings.push(warning)
        if (this.warnings.length > this.config.metricsHistorySize) {
          this.warnings.shift()
        }

        this.stats.warnings++

        this.logEvent({
          type: 'fps_drop',
          timestamp: Date.now(),
          data: { fps, threshold: this.thresholds.minFps, level: warningLevel },
        })
      }
    }
  }

  private checkMemoryWarnings(used: number): void {
    let warningLevel: PerformanceWarningLevel = 'none'
    let message = ''

    if (used >= this.thresholds.criticalMemory) {
      warningLevel = 'critical'
      message = `Critical memory usage: ${used.toFixed(0)}MB (limit: ${this.thresholds.criticalMemory}MB)`
    } else if (used >= this.thresholds.maxMemory) {
      warningLevel = 'high'
      message = `High memory usage: ${used.toFixed(0)}MB (target: ${this.thresholds.maxMemory}MB)`
    } else if (used >= this.thresholds.maxMemory * 0.8) {
      warningLevel = 'medium'
      message = `Memory usage elevated: ${used.toFixed(0)}MB (target: ${this.thresholds.maxMemory}MB)`
    }

    if (warningLevel !== 'none') {
      const warning: PerformanceWarning = {
        level: warningLevel,
        type: 'memory',
        message,
        value: used,
        threshold: this.thresholds.maxMemory,
        timestamp: Date.now(),
      }

      this.warnings.push(warning)
      if (this.warnings.length > this.config.metricsHistorySize) {
        this.warnings.shift()
      }

      this.stats.warnings++

      const eventType = warningLevel === 'critical' ? 'memory_critical' : 'memory_warning'
      this.logEvent({
        type: eventType,
        timestamp: Date.now(),
        data: { used, threshold: this.thresholds.maxMemory, level: warningLevel },
      })
    }
  }

  private logEvent(event: PerformanceEvent): void {
    this.events.push(event)
    if (this.events.length > this.config.metricsHistorySize * 2) {
      this.events.shift()
    }

    if (__DEV__ && this.config.enableWarnings) {
      const eventData = event.data ? JSON.stringify(event.data) : ''
      console.log(`[Performance] ${event.type} ${eventData}`)
    }
  }
}
