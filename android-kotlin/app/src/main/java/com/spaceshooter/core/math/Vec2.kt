package com.spaceshooter.core.math

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * 2D Vector value class for game math operations.
 *
 * This is an inline value class that packs two Float values (x, y) into a single Long
 * to eliminate heap allocations. The compiler can often avoid boxing this to an object,
 * resulting in zero-allocation vector arithmetic in hot paths like the game loop.
 *
 * Packing: Long = (x.toBits().toLong() shl 32) or (y.toBits().toLong() and 0xFFFFFFFF)
 * Unpacking: x = Float.fromBits((packed shr 32).toInt()), y = Float.fromBits(packed.toInt())
 *
 * This optimization is critical because Vec2 operations occur thousands of times per frame
 * (position updates, velocity calculations, normalizations, etc.). At 60fps with typical
 * gameplay, the old data class version generated 60,000-180,000 short-lived objects per second.
 */
@JvmInline
value class Vec2(val packed: Long) {

    /**
     * X component (unpacked from upper 32 bits of packed Long).
     */
    inline val x: Float
        get() = Float.fromBits((packed shr 32).toInt())

    /**
     * Y component (unpacked from lower 32 bits of packed Long).
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
         */
        private inline fun pack(x: Float, y: Float): Long {
            return (x.toBits().toLong() shl 32) or (y.toBits().toLong() and 0xFFFFFFFF)
        }

        /**
         * Primary constructor that takes x and y components.
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
