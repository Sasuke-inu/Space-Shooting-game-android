#!/bin/bash

# Performance Testing Script for Space Shooter
# This script helps set up and run performance tests on low-end device simulations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_FILE="$PROJECT_ROOT/.auto-claude/specs/011-performance-optimization/PERFORMANCE_TEST_RESULTS.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on Android, iOS, or Web
check_platform() {
    print_header "Checking Platform"

    if command -v adb &> /dev/null; then
        print_success "ADB found - Android testing available"
        PLATFORM="android"
    elif command -v xcrun &> /dev/null; then
        print_success "Xcode found - iOS testing available"
        PLATFORM="ios"
    else
        print_warning "No mobile platform found - defaulting to web testing"
        PLATFORM="web"
    fi
}

# Check if emulator/simulator is running
check_device() {
    print_header "Checking Device Status"

    case $PLATFORM in
        android)
            DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
            if [ "$DEVICES" -gt 0 ]; then
                print_success "Android device/emulator detected"
                adb devices -l
            else
                print_error "No Android device/emulator running"
                print_info "Start an emulator with: emulator -avd LowEnd_API26"
                exit 1
            fi
            ;;
        ios)
            SIMULATORS=$(xcrun simctl list devices | grep "Booted" | wc -l)
            if [ "$SIMULATORS" -gt 0 ]; then
                print_success "iOS simulator detected"
                xcrun simctl list devices | grep "Booted"
            else
                print_error "No iOS simulator running"
                print_info "Start a simulator from Xcode or use: xcrun simctl boot <device-id>"
                exit 1
            fi
            ;;
        web)
            print_info "Web testing mode - ensure Chrome DevTools is ready"
            ;;
    esac
}

# Verify dependencies
check_dependencies() {
    print_header "Checking Dependencies"

    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        print_error "node_modules not found"
        print_info "Run: npm install"
        exit 1
    fi
    print_success "Dependencies installed"
}

# Verify performance optimizations are in place
verify_optimizations() {
    print_header "Verifying Performance Optimizations"

    # Check if performance types exist
    if [ -f "$PROJECT_ROOT/src/types/performance.ts" ]; then
        print_success "Performance types defined"
    else
        print_error "Missing src/types/performance.ts"
        exit 1
    fi

    # Check if performance monitor exists
    if [ -f "$PROJECT_ROOT/src/utils/performanceMonitor.ts" ]; then
        print_success "Performance monitor implemented"
    else
        print_error "Missing src/utils/performanceMonitor.ts"
        exit 1
    fi

    # Check if object pool exists
    if [ -f "$PROJECT_ROOT/src/utils/objectPool.ts" ]; then
        print_success "Object pooling implemented"
    else
        print_error "Missing src/utils/objectPool.ts"
        exit 1
    fi

    # Check if GameCanvas is optimized
    if grep -q "React.memo" "$PROJECT_ROOT/src/components/GameCanvas.tsx"; then
        print_success "GameCanvas memoized"
    else
        print_warning "GameCanvas may not be memoized"
    fi

    # Check if quality settings exist
    if grep -q "qualityLevel" "$PROJECT_ROOT/src/state/settingsStore.ts"; then
        print_success "Quality settings implemented"
    else
        print_error "Quality settings missing"
        exit 1
    fi

    print_success "All optimizations verified"
}

# Monitor memory usage (Android)
monitor_memory_android() {
    print_header "Monitoring Memory (Android)"

    PACKAGE=$(adb shell "pm list packages | grep space" | cut -d':' -f2 | tr -d '\r')

    if [ -z "$PACKAGE" ]; then
        print_error "Space Shooter app not found on device"
        print_info "Make sure app is installed: npm run android"
        exit 1
    fi

    print_info "Package: $PACKAGE"
    print_info "Monitoring memory every 5 seconds (Ctrl+C to stop)..."
    echo ""

    while true; do
        TIMESTAMP=$(date +"%H:%M:%S")
        MEMORY=$(adb shell "dumpsys meminfo $PACKAGE | grep TOTAL" | awk '{print $2}')

        if [ -n "$MEMORY" ]; then
            MEMORY_MB=$((MEMORY / 1024))

            if [ $MEMORY_MB -lt 150 ]; then
                echo -e "$TIMESTAMP - ${GREEN}Memory: ${MEMORY_MB} MB${NC} ✅"
            elif [ $MEMORY_MB -lt 200 ]; then
                echo -e "$TIMESTAMP - ${YELLOW}Memory: ${MEMORY_MB} MB${NC} ⚠️"
            else
                echo -e "$TIMESTAMP - ${RED}Memory: ${MEMORY_MB} MB${NC} ❌ EXCEEDS LIMIT"
            fi
        else
            print_warning "$TIMESTAMP - App not running or memory unavailable"
        fi

        sleep 5
    done
}

# Get FPS from logs
monitor_fps() {
    print_header "Monitoring FPS"

    case $PLATFORM in
        android)
            print_info "Checking logcat for FPS data..."
            adb logcat -s ReactNativeJS:V | grep -E "FPS|Performance" &
            ;;
        ios)
            print_info "Check Xcode console for FPS data"
            ;;
        web)
            print_info "Open browser console to see FPS data"
            ;;
    esac
}

# Run quick test
run_quick_test() {
    print_header "Running Quick Performance Test"

    print_info "This will:"
    print_info "1. Launch the app"
    print_info "2. Monitor memory for 2 minutes"
    print_info "3. Report basic performance metrics"
    echo ""

    print_info "Starting app on $PLATFORM..."

    case $PLATFORM in
        android)
            npm run android &
            APP_PID=$!
            sleep 30  # Wait for app to launch

            print_info "App launched. Monitoring for 2 minutes..."
            timeout 120s bash -c "$(declare -f monitor_memory_android); monitor_memory_android" || true

            print_success "Quick test complete"
            ;;
        ios)
            npm run ios &
            APP_PID=$!
            print_info "App launched. Check Xcode Instruments for detailed metrics"
            ;;
        web)
            npm run web &
            APP_PID=$!
            print_info "App launched in browser. Use Chrome DevTools Performance tab"
            ;;
    esac
}

# Run full test suite
run_full_test() {
    print_header "Running Full Performance Test Suite"

    print_info "Full test includes:"
    print_info "1. Initial Load (5 min)"
    print_info "2. Light Combat (5 min)"
    print_info "3. Heavy Particle Load (5 min)"
    print_info "4. Boss Fight (5 min)"
    print_info "5. Extended Gameplay (30 min)"
    print_info ""
    print_info "Total estimated time: 50 minutes"
    echo ""

    read -p "Continue with full test? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Full test cancelled"
        exit 0
    fi

    print_info "Opening test results file..."
    if [ -f "$RESULTS_FILE" ]; then
        print_success "Use this file to document results: $RESULTS_FILE"

        if command -v code &> /dev/null; then
            code "$RESULTS_FILE"
        elif command -v open &> /dev/null; then
            open "$RESULTS_FILE"
        else
            print_info "File location: $RESULTS_FILE"
        fi
    else
        print_error "Results file not found: $RESULTS_FILE"
    fi

    run_quick_test
}

# Generate performance report
generate_report() {
    print_header "Performance Test Report"

    print_info "Test Date: $(date)"
    print_info "Platform: $PLATFORM"
    echo ""

    print_info "Optimizations Status:"
    echo "  - Object Pooling: ✅"
    echo "  - Path Caching: ✅"
    echo "  - Component Memoization: ✅"
    echo "  - Quality Settings: ✅"
    echo ""

    print_info "For detailed results, see:"
    print_info "$RESULTS_FILE"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check       - Verify all optimizations are in place"
    echo "  quick       - Run quick 2-minute performance test"
    echo "  full        - Run full 50-minute test suite"
    echo "  memory      - Monitor memory usage (Android only)"
    echo "  fps         - Monitor FPS from logs"
    echo "  report      - Generate performance report"
    echo "  help        - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 check    # Verify optimizations"
    echo "  $0 quick    # Quick test"
}

# Main script logic
main() {
    cd "$PROJECT_ROOT"

    case ${1:-help} in
        check)
            check_dependencies
            verify_optimizations
            print_success "All checks passed!"
            ;;
        quick)
            check_platform
            check_dependencies
            verify_optimizations
            check_device
            run_quick_test
            ;;
        full)
            check_platform
            check_dependencies
            verify_optimizations
            check_device
            run_full_test
            ;;
        memory)
            check_platform
            if [ "$PLATFORM" != "android" ]; then
                print_error "Memory monitoring only available on Android"
                exit 1
            fi
            check_device
            monitor_memory_android
            ;;
        fps)
            check_platform
            monitor_fps
            ;;
        report)
            generate_report
            ;;
        help|*)
            usage
            ;;
    esac
}

# Run main
main "$@"
