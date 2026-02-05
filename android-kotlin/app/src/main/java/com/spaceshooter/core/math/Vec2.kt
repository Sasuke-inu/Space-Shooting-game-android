package com.spaceshooter.core.math

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * 2D Vector value class for game math operations.
 *
 * ## Value Class Optimization
 *
 * This is a Kotlin value class (formerly "inline class") marked with @JvmInline that packs
 * two Float values (x, y) into a single Long primitive. Value classes are a compiler optimization
 * that eliminates heap allocations by unwrapping the wrapper type to its underlying value in
 * most scenarios, resulting in zero runtime overhead.
 *
 * ### Packing Mechanism
 *
 * Two 32-bit Float values are packed into a single 64-bit Long using bitwise operations:
 * - **Packing formula**: `Long = (x.toBits().toLong() shl 32) or (y.toBits().toLong() and 0xFFFFFFFF)`
 * - **Unpacking formula**: `x = Float.fromBits((packed shr 32).toInt()), y = Float.fromBits(packed.toInt())`
 *
 * The x component occupies the upper 32 bits and y occupies the lower 32 bits. This bitwise
 * packing preserves the exact IEEE 754 representation of both floats without precision loss.
 *
 * ### Performance Benefits
 *
 * This optimization is critical for the game loop, where Vec2 operations occur thousands of
 * times per frame:
 * - **Position updates**: `bullet.pos + bullet.vel * dt` (2 allocations per entity per frame)
 * - **Velocity updates**: `particle.vel * friction` (1 allocation per particle per frame)
 * - **Normalizations**: `direction.normalized()` (1 allocation per use)
 * - **Rotations**: `velocity.rotate(angle)` (1 allocation per use)
 *
 * With typical gameplay at 60fps (50 bullets, 30 particles, 10 asteroids, 5 enemies), the
 * old data class version generated an estimated **1,000-3,000 Vec2 objects per frame**
 * (60,000-180,000 objects/second). The value class eliminates most of these allocations.
 *
 * ### When the Compiler INLINES (Zero Allocation)
 *
 * The Kotlin compiler can avoid boxing and use the underlying Long directly in these cases:
 * - **Local variables**: `val pos = Vec2(10f, 20f)` (stored as Long on stack)
 * - **Function parameters**: `fun move(pos: Vec2)` (passed as Long primitive)
 * - **Return values**: `fun getPosition(): Vec2` (returned as Long)
 * - **Arithmetic chains**: `pos + vel * dt` (intermediate results stay as Long)
 * - **Generic type arguments with reified generics**: Some generic contexts with inline functions
 *
 * ### When the Compiler BOXES (Heap Allocation)
 *
 * Boxing (wrapping in an object) is still required in these scenarios:
 * - **Type parameters without reified**: `List<Vec2>` (each element is boxed)
 * - **Nullable types**: `Vec2?` (must be boxed to represent null)
 * - **Casting to Any**: `vec as Any` (forces boxing)
 * - **Reflection usage**: Accessing properties via reflection
 * - **Interface implementations**: If Vec2 implemented an interface (it doesn't)
 *
 * Despite these boxing cases, the vast majority of Vec2 usage in the game loop benefits
 * from zero-allocation inlining.
 *
 * ### Comparison to Object Pooling
 *
 * Value classes are fundamentally different from object pooling:
 * - **Value class**: Compiler optimization, zero runtime cost, automatic
 * - **Object pooling**: Manual pool management, acquire/release overhead, explicit
 *
 * Both optimizations can be combined, but value classes eliminate allocations at a more
 * fundamental level with no code changes required at call sites.
 *
 * @property packed The underlying Long storage containing both x and y components.
 * Upper 32 bits store x, lower 32 bits store y, both as IEEE 754 float bit patterns.
 */
@JvmInline
value class Vec2(val packed: Long) {

    /**
     * X component (unpacked from upper 32 bits of packed Long).
     *
     * The unpacking operation `Float.fromBits((packed shr 32).toInt())` is marked inline,
     * meaning the compiler will replace property access with direct bit manipulation,
     * avoiding any method call overhead. The right-shift extracts the upper 32 bits,
     * which are then reinterpreted as a Float using IEEE 754 bit pattern.
     */
    inline val x: Float
        get() = Float.fromBits((packed shr 32).toInt())

    /**
     * Y component (unpacked from lower 32 bits of packed Long).
     *
     * The unpacking operation `Float.fromBits(packed.toInt())` is marked inline for
     * zero overhead access. Casting Long to Int automatically truncates to the lower
     * 32 bits, which are then reinterpreted as a Float using IEEE 754 bit pattern.
     */
    inline val y: Float
        get() = Float.fromBits(packed.toInt())

    // Operator overloading for vector arithmetic
    operator fun plus(other: Vec2) = Vec2(x + other.x, y + other.y)
    operator fun minus(other: Vec2) = Vec2(x - other.x, y - other.y)
    operator fun times(scalar: Float) = Vec2(x * scalar, y * scalar)
    operator fun div(scalar: Float) = Vec2(x / scalar, y / scalar)
    operator fun unaryMinus() = Vec2(-x, -y)

    /**
     * Calculate the length (magnitude) of the vector.
     */
    fun length(): Float = sqrt(x * x + y * y)

    /**
     * Calculate the squared length (avoids sqrt for performance).
     */
    fun lengthSquared(): Float = x * x + y * y

    /**
     * Return a normalized (unit) vector.
     */
    fun normalized(): Vec2 {
        val len = length()
        return if (len > 0f) this / len else ZERO
    }

    /**
     * Calculate the angle of the vector in radians.
     */
    fun angle(): Float = atan2(y, x)

    /**
     * Rotate the vector by the given angle in radians.
     */
    fun rotate(angle: Float): Vec2 {
        val cos = cos(angle)
        val sin = sin(angle)
        return Vec2(
            x * cos - y * sin,
            x * sin + y * cos
        )
    }

    /**
     * Calculate dot product with another vector.
     */
    fun dot(other: Vec2): Float = x * other.x + y * other.y

    /**
     * Calculate the 2D cross product (returns scalar).
     */
    fun cross(other: Vec2): Float = x * other.y - y * other.x

    /**
     * Linear interpolation between this vector and another.
     */
    fun lerp(target: Vec2, t: Float): Vec2 = Vec2(
        x + (target.x - x) * t,
        y + (target.y - y) * t
    )

    companion object {
        /**
         * Pack two Float values into a Long for value class storage.
         *
         * This function converts two 32-bit Floats into their IEEE 754 bit representations
         * and packs them into a single 64-bit Long:
         * 1. `x.toBits()` converts Float to its 32-bit IEEE 754 representation (preserves exact value)
         * 2. Left-shift by 32 bits to move x into the upper half of the Long
         * 3. `y.toBits()` converts y to its 32-bit IEEE 754 representation
         * 4. Bitwise AND with 0xFFFFFFFF ensures y stays in lower 32 bits (unsigned conversion)
         * 5. Bitwise OR combines both halves into a single Long
         *
         * This packing is lossless - both Float values can be perfectly reconstructed via
         * unpacking, including special values like NaN, Infinity, and signed zero.
         *
         * @param x The x component to pack into upper 32 bits
         * @param y The y component to pack into lower 32 bits
         * @return A Long containing both Float values as bit patterns
         */
        private inline fun pack(x: Float, y: Float): Long {
            return (x.toBits().toLong() shl 32) or (y.toBits().toLong() and 0xFFFFFFFF)
        }

        /**
         * Primary constructor that takes x and y components.
         *
         * This invoke operator allows creating Vec2 instances with natural syntax:
         * ```kotlin
         * val pos = Vec2(10f, 20f)  // Calls this invoke operator
         * val zero = Vec2()          // Uses default parameters (0f, 0f)
         * ```
         *
         * The operator internally packs the x and y components into a Long and delegates
         * to the value class primary constructor. This is the recommended way to create
         * Vec2 instances - direct construction with a packed Long is available but not
         * intended for general use.
         *
         * @param x The x component (default: 0f)
         * @param y The y component (default: 0f)
         * @return A new Vec2 with the specified components packed into a Long
         */
        operator fun invoke(x: Float = 0f, y: Float = 0f): Vec2 = Vec2(pack(x, y))

        val ZERO = Vec2(0f, 0f)
        val UP = Vec2(0f, -1f)
        val DOWN = Vec2(0f, 1f)
        val LEFT = Vec2(-1f, 0f)
        val RIGHT = Vec2(1f, 0f)

        /**
         * Create a vector from an angle and magnitude.
         */
        fun fromAngle(angle: Float, length: Float = 1f): Vec2 = Vec2(
            cos(angle) * length,
            sin(angle) * length
        )

        /**
         * Calculate the squared distance between two points (avoids sqrt).
         */
        fun distanceSquared(a: Vec2, b: Vec2): Float {
            val dx = a.x - b.x
            val dy = a.y - b.y
            return dx * dx + dy * dy
        }

        /**
         * Calculate the distance between two points.
         */
        fun distance(a: Vec2, b: Vec2): Float = sqrt(distanceSquared(a, b))

        /**
         * Wrap a position within bounds (toroidal world).
         */
        fun wrap(pos: Vec2, width: Float, height: Float): Vec2 = Vec2(
            ((pos.x % width) + width) % width,
            ((pos.y % height) + height) % height
        )

        /**
         * Generate a random vector within the given range.
         */
        fun random(minX: Float, maxX: Float, minY: Float, maxY: Float): Vec2 = Vec2(
            Random.nextFloat() * (maxX - minX) + minX,
            Random.nextFloat() * (maxY - minY) + minY
        )

        /**
         * Generate a random unit vector.
         */
        fun randomUnit(): Vec2 {
            val angle = Random.nextFloat() * 2f * Math.PI.toFloat()
            return fromAngle(angle)
        }

        /**
         * Clamp a value between min and max.
         */
        fun clamp(value: Float, min: Float, max: Float): Float =
            maxOf(min, minOf(max, value))
    }
}

/**
 * Extension function for Float to multiply with Vec2.
 */
operator fun Float.times(vec: Vec2): Vec2 = vec * this
