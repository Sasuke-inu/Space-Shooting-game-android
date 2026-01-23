package com.spaceshooter.core.math

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

/**
 * 2D Vector class for game math operations.
 * Immutable data class with operator overloading for clean syntax.
 */
data class Vec2(val x: Float = 0f, val y: Float = 0f) {

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
