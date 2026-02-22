package com.spaceshooter.core.math

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Unit tests for Vec2 value class implementation.
 *
 * Verifies:
 * - Packing/unpacking of Float components into/from Long
 * - Arithmetic operators
 * - Utility methods (length, normalized, angle, rotate, dot, cross, lerp)
 * - Factory methods (fromAngle, random, wrap)
 * - Companion object constants
 * - Edge cases (zero vector, negative values, extreme values)
 * - Value class semantics (equality, hashCode)
 */
class Vec2Test {

    companion object {
        private const val EPSILON = 1e-6f

        private fun assertFloatEquals(expected: Float, actual: Float, delta: Float = EPSILON) {
            assertEquals(expected, actual, delta)
        }

        private fun assertVec2Equals(expected: Vec2, actual: Vec2, delta: Float = EPSILON) {
            assertFloatEquals(expected.x, actual.x, delta)
            assertFloatEquals(expected.y, actual.y, delta)
        }
    }

    // ========== Packing/Unpacking Tests ==========

    @Test
    fun testPackingAndUnpacking_positiveValues() {
        val vec = Vec2(3.14f, 2.71f)
        assertFloatEquals(3.14f, vec.x)
        assertFloatEquals(2.71f, vec.y)
    }

    @Test
    fun testPackingAndUnpacking_negativeValues() {
        val vec = Vec2(-5.5f, -10.25f)
        assertFloatEquals(-5.5f, vec.x)
        assertFloatEquals(-10.25f, vec.y)
    }

    @Test
    fun testPackingAndUnpacking_zeroValues() {
        val vec = Vec2(0f, 0f)
        assertFloatEquals(0f, vec.x)
        assertFloatEquals(0f, vec.y)
    }

    @Test
    fun testPackingAndUnpacking_mixedSignValues() {
        val vec = Vec2(-7.5f, 3.5f)
        assertFloatEquals(-7.5f, vec.x)
        assertFloatEquals(3.5f, vec.y)
    }

    @Test
    fun testPackingAndUnpacking_verySmallValues() {
        val vec = Vec2(0.000001f, -0.000001f)
        assertFloatEquals(0.000001f, vec.x)
        assertFloatEquals(-0.000001f, vec.y)
    }

    @Test
    fun testPackingAndUnpacking_veryLargeValues() {
        val vec = Vec2(1000000f, -1000000f)
        assertFloatEquals(1000000f, vec.x)
        assertFloatEquals(-1000000f, vec.y)
    }

    // ========== Arithmetic Operators Tests ==========

    @Test
    fun testPlus_operator() {
        val a = Vec2(3f, 4f)
        val b = Vec2(1f, 2f)
        val result = a + b
        assertVec2Equals(Vec2(4f, 6f), result)
    }

    @Test
    fun testPlus_withNegativeValues() {
        val a = Vec2(5f, -3f)
        val b = Vec2(-2f, 7f)
        val result = a + b
        assertVec2Equals(Vec2(3f, 4f), result)
    }

    @Test
    fun testMinus_operator() {
        val a = Vec2(5f, 8f)
        val b = Vec2(2f, 3f)
        val result = a - b
        assertVec2Equals(Vec2(3f, 5f), result)
    }

    @Test
    fun testMinus_withNegativeResult() {
        val a = Vec2(1f, 2f)
        val b = Vec2(3f, 5f)
        val result = a - b
        assertVec2Equals(Vec2(-2f, -3f), result)
    }

    @Test
    fun testTimes_scalarMultiplication() {
        val vec = Vec2(3f, 4f)
        val result = vec * 2f
        assertVec2Equals(Vec2(6f, 8f), result)
    }

    @Test
    fun testTimes_negativeScalar() {
        val vec = Vec2(2f, -3f)
        val result = vec * -2f
        assertVec2Equals(Vec2(-4f, 6f), result)
    }

    @Test
    fun testTimes_zeroScalar() {
        val vec = Vec2(5f, 7f)
        val result = vec * 0f
        assertVec2Equals(Vec2(0f, 0f), result)
    }

    @Test
    fun testDiv_scalarDivision() {
        val vec = Vec2(6f, 8f)
        val result = vec / 2f
        assertVec2Equals(Vec2(3f, 4f), result)
    }

    @Test
    fun testDiv_negativeScalar() {
        val vec = Vec2(10f, -20f)
        val result = vec / -2f
        assertVec2Equals(Vec2(-5f, 10f), result)
    }

    @Test
    fun testUnaryMinus_operator() {
        val vec = Vec2(3f, -4f)
        val result = -vec
        assertVec2Equals(Vec2(-3f, 4f), result)
    }

    @Test
    fun testFloatTimes_extensionFunction() {
        val vec = Vec2(2f, 3f)
        val result = 3f * vec
        assertVec2Equals(Vec2(6f, 9f), result)
    }

    // ========== Utility Methods Tests ==========

    @Test
    fun testLength_calculation() {
        val vec = Vec2(3f, 4f)
        assertFloatEquals(5f, vec.length())
    }

    @Test
    fun testLength_zeroVector() {
        val vec = Vec2(0f, 0f)
        assertFloatEquals(0f, vec.length())
    }

    @Test
    fun testLengthSquared_calculation() {
        val vec = Vec2(3f, 4f)
        assertFloatEquals(25f, vec.lengthSquared())
    }

    @Test
    fun testLengthSquared_zeroVector() {
        val vec = Vec2(0f, 0f)
        assertFloatEquals(0f, vec.lengthSquared())
    }

    @Test
    fun testNormalized_returnsUnitVector() {
        val vec = Vec2(3f, 4f)
        val normalized = vec.normalized()
        assertFloatEquals(1f, normalized.length())
        assertVec2Equals(Vec2(0.6f, 0.8f), normalized)
    }

    @Test
    fun testNormalized_zeroVector() {
        val vec = Vec2(0f, 0f)
        val normalized = vec.normalized()
        assertVec2Equals(Vec2.ZERO, normalized)
    }

    @Test
    fun testAngle_calculation() {
        val vec = Vec2(1f, 0f)
        assertFloatEquals(0f, vec.angle())
    }

    @Test
    fun testAngle_90degrees() {
        val vec = Vec2(0f, 1f)
        assertFloatEquals(PI.toFloat() / 2f, vec.angle())
    }

    @Test
    fun testRotate_90degrees() {
        val vec = Vec2(1f, 0f)
        val rotated = vec.rotate(PI.toFloat() / 2f)
        assertVec2Equals(Vec2(0f, 1f), rotated, delta = 1e-5f)
    }

    @Test
    fun testRotate_180degrees() {
        val vec = Vec2(1f, 0f)
        val rotated = vec.rotate(PI.toFloat())
        assertVec2Equals(Vec2(-1f, 0f), rotated, delta = 1e-5f)
    }

    @Test
    fun testRotate_negativeAngle() {
        val vec = Vec2(1f, 0f)
        val rotated = vec.rotate(-PI.toFloat() / 2f)
        assertVec2Equals(Vec2(0f, -1f), rotated, delta = 1e-5f)
    }

    @Test
    fun testDot_product() {
        val a = Vec2(2f, 3f)
        val b = Vec2(4f, 5f)
        assertFloatEquals(23f, a.dot(b))
    }

    @Test
    fun testDot_orthogonalVectors() {
        val a = Vec2(1f, 0f)
        val b = Vec2(0f, 1f)
        assertFloatEquals(0f, a.dot(b))
    }

    @Test
    fun testDot_parallelVectors() {
        val a = Vec2(2f, 0f)
        val b = Vec2(4f, 0f)
        assertFloatEquals(8f, a.dot(b))
    }

    @Test
    fun testCross_product() {
        val a = Vec2(2f, 3f)
        val b = Vec2(4f, 5f)
        assertFloatEquals(-2f, a.cross(b))
    }

    @Test
    fun testCross_parallelVectors() {
        val a = Vec2(2f, 4f)
        val b = Vec2(1f, 2f)
        assertFloatEquals(0f, a.cross(b))
    }

    @Test
    fun testLerp_midpoint() {
        val a = Vec2(0f, 0f)
        val b = Vec2(10f, 10f)
        val result = a.lerp(b, 0.5f)
        assertVec2Equals(Vec2(5f, 5f), result)
    }

    @Test
    fun testLerp_atStart() {
        val a = Vec2(1f, 2f)
        val b = Vec2(5f, 6f)
        val result = a.lerp(b, 0f)
        assertVec2Equals(a, result)
    }

    @Test
    fun testLerp_atEnd() {
        val a = Vec2(1f, 2f)
        val b = Vec2(5f, 6f)
        val result = a.lerp(b, 1f)
        assertVec2Equals(b, result)
    }

    @Test
    fun testLerp_quarterWay() {
        val a = Vec2(0f, 0f)
        val b = Vec2(4f, 8f)
        val result = a.lerp(b, 0.25f)
        assertVec2Equals(Vec2(1f, 2f), result)
    }

    // ========== Companion Object Constants Tests ==========

    @Test
    fun testZero_constant() {
        assertVec2Equals(Vec2(0f, 0f), Vec2.ZERO)
    }

    @Test
    fun testUp_constant() {
        assertVec2Equals(Vec2(0f, -1f), Vec2.UP)
    }

    @Test
    fun testDown_constant() {
        assertVec2Equals(Vec2(0f, 1f), Vec2.DOWN)
    }

    @Test
    fun testLeft_constant() {
        assertVec2Equals(Vec2(-1f, 0f), Vec2.LEFT)
    }

    @Test
    fun testRight_constant() {
        assertVec2Equals(Vec2(1f, 0f), Vec2.RIGHT)
    }

    // ========== Factory Methods Tests ==========

    @Test
    fun testFromAngle_zeroAngle() {
        val vec = Vec2.fromAngle(0f)
        assertVec2Equals(Vec2(1f, 0f), vec)
    }

    @Test
    fun testFromAngle_90degrees() {
        val vec = Vec2.fromAngle(PI.toFloat() / 2f)
        assertVec2Equals(Vec2(0f, 1f), vec, delta = 1e-5f)
    }

    @Test
    fun testFromAngle_withLength() {
        val vec = Vec2.fromAngle(0f, 5f)
        assertVec2Equals(Vec2(5f, 0f), vec)
    }

    @Test
    fun testFromAngle_180degrees() {
        val vec = Vec2.fromAngle(PI.toFloat())
        assertVec2Equals(Vec2(-1f, 0f), vec, delta = 1e-5f)
    }

    @Test
    fun testDistanceSquared_calculation() {
        val a = Vec2(0f, 0f)
        val b = Vec2(3f, 4f)
        assertFloatEquals(25f, Vec2.distanceSquared(a, b))
    }

    @Test
    fun testDistanceSquared_samePoint() {
        val a = Vec2(5f, 7f)
        val b = Vec2(5f, 7f)
        assertFloatEquals(0f, Vec2.distanceSquared(a, b))
    }

    @Test
    fun testDistance_calculation() {
        val a = Vec2(0f, 0f)
        val b = Vec2(3f, 4f)
        assertFloatEquals(5f, Vec2.distance(a, b))
    }

    @Test
    fun testDistance_samePoint() {
        val a = Vec2(2f, 3f)
        val b = Vec2(2f, 3f)
        assertFloatEquals(0f, Vec2.distance(a, b))
    }

    @Test
    fun testWrap_withinBounds() {
        val pos = Vec2(5f, 10f)
        val wrapped = Vec2.wrap(pos, 20f, 30f)
        assertVec2Equals(Vec2(5f, 10f), wrapped)
    }

    @Test
    fun testWrap_exceedWidth() {
        val pos = Vec2(25f, 10f)
        val wrapped = Vec2.wrap(pos, 20f, 30f)
        assertVec2Equals(Vec2(5f, 10f), wrapped)
    }

    @Test
    fun testWrap_exceedHeight() {
        val pos = Vec2(5f, 35f)
        val wrapped = Vec2.wrap(pos, 20f, 30f)
        assertVec2Equals(Vec2(5f, 5f), wrapped)
    }

    @Test
    fun testWrap_negativeValues() {
        val pos = Vec2(-5f, -10f)
        val wrapped = Vec2.wrap(pos, 20f, 30f)
        assertVec2Equals(Vec2(15f, 20f), wrapped)
    }

    @Test
    fun testRandom_withinRange() {
        // Test multiple times to ensure randomness stays in range
        repeat(10) {
            val vec = Vec2.random(0f, 10f, 0f, 20f)
            assertTrue(vec.x >= 0f && vec.x <= 10f)
            assertTrue(vec.y >= 0f && vec.y <= 20f)
        }
    }

    @Test
    fun testRandom_negativeRange() {
        repeat(10) {
            val vec = Vec2.random(-10f, -5f, -20f, -15f)
            assertTrue(vec.x >= -10f && vec.x <= -5f)
            assertTrue(vec.y >= -20f && vec.y <= -15f)
        }
    }

    @Test
    fun testRandomUnit_isUnitVector() {
        repeat(10) {
            val vec = Vec2.randomUnit()
            assertFloatEquals(1f, vec.length(), delta = 1e-5f)
        }
    }

    @Test
    fun testClamp_withinRange() {
        val result = Vec2.clamp(5f, 0f, 10f)
        assertFloatEquals(5f, result)
    }

    @Test
    fun testClamp_belowMin() {
        val result = Vec2.clamp(-5f, 0f, 10f)
        assertFloatEquals(0f, result)
    }

    @Test
    fun testClamp_aboveMax() {
        val result = Vec2.clamp(15f, 0f, 10f)
        assertFloatEquals(10f, result)
    }

    @Test
    fun testClamp_atMin() {
        val result = Vec2.clamp(0f, 0f, 10f)
        assertFloatEquals(0f, result)
    }

    @Test
    fun testClamp_atMax() {
        val result = Vec2.clamp(10f, 0f, 10f)
        assertFloatEquals(10f, result)
    }

    // ========== Equality and HashCode Tests ==========

    @Test
    fun testEquals_sameValues() {
        val a = Vec2(3.5f, 7.2f)
        val b = Vec2(3.5f, 7.2f)
        assertEquals(a, b)
    }

    @Test
    fun testEquals_differentValues() {
        val a = Vec2(3.5f, 7.2f)
        val b = Vec2(3.5f, 7.3f)
        assertNotEquals(a, b)
    }

    @Test
    fun testEquals_zeroVectors() {
        val a = Vec2(0f, 0f)
        val b = Vec2.ZERO
        assertEquals(a, b)
    }

    @Test
    fun testHashCode_sameValues() {
        val a = Vec2(5f, 10f)
        val b = Vec2(5f, 10f)
        assertEquals(a.hashCode(), b.hashCode())
    }

    @Test
    fun testHashCode_differentValues() {
        val a = Vec2(5f, 10f)
        val b = Vec2(5f, 11f)
        assertNotEquals(a.hashCode(), b.hashCode())
    }

    @Test
    fun testHashCode_negativeValues() {
        val a = Vec2(-3f, -7f)
        val b = Vec2(-3f, -7f)
        assertEquals(a.hashCode(), b.hashCode())
    }

    // ========== Edge Cases Tests ==========

    @Test
    fun testEdgeCase_maxFloatValue() {
        val vec = Vec2(Float.MAX_VALUE, Float.MAX_VALUE)
        assertFloatEquals(Float.MAX_VALUE, vec.x)
        assertFloatEquals(Float.MAX_VALUE, vec.y)
    }

    @Test
    fun testEdgeCase_minFloatValue() {
        val vec = Vec2(Float.MIN_VALUE, Float.MIN_VALUE)
        assertFloatEquals(Float.MIN_VALUE, vec.x)
        assertFloatEquals(Float.MIN_VALUE, vec.y)
    }

    @Test
    fun testEdgeCase_negativeZero() {
        val vec = Vec2(-0f, -0f)
        assertFloatEquals(0f, vec.x)
        assertFloatEquals(0f, vec.y)
    }

    @Test
    fun testEdgeCase_multipleOperationsChained() {
        val result = Vec2(1f, 2f) + Vec2(3f, 4f) * 2f - Vec2(1f, 1f)
        assertVec2Equals(Vec2(6f, 9f), result)
    }

    @Test
    fun testEdgeCase_normalizeVerySmallVector() {
        val vec = Vec2(0.00001f, 0.00001f)
        val normalized = vec.normalized()
        assertFloatEquals(1f, normalized.length(), delta = 1e-4f)
    }

    @Test
    fun testEdgeCase_rotateZeroVector() {
        val vec = Vec2.ZERO
        val rotated = vec.rotate(PI.toFloat() / 4f)
        assertVec2Equals(Vec2.ZERO, rotated)
    }

    // ========== Value Class Semantics Tests ==========

    @Test
    fun testValueClass_passByValue() {
        val original = Vec2(5f, 10f)
        val modified = original + Vec2(1f, 1f)

        // Original should be unchanged (value semantics)
        assertVec2Equals(Vec2(5f, 10f), original)
        assertVec2Equals(Vec2(6f, 11f), modified)
    }

    @Test
    fun testValueClass_constantsAreImmutable() {
        val zero = Vec2.ZERO
        val modified = zero + Vec2(1f, 1f)

        // ZERO constant should remain unchanged
        assertVec2Equals(Vec2(0f, 0f), Vec2.ZERO)
        assertVec2Equals(Vec2(1f, 1f), modified)
    }

    @Test
    fun testValueClass_noHeapAllocationSemantics() {
        // This test verifies that operations work correctly with value semantics
        // Actual heap allocation elimination is a compiler optimization
        val vec1 = Vec2(1f, 2f)
        val vec2 = Vec2(3f, 4f)

        val result = vec1 + vec2 * 2f - vec1 / 2f

        assertVec2Equals(Vec2(6.5f, 9f), result)
    }

    @Test
    fun testValueClass_collectionUsage() {
        val vectors = listOf(
            Vec2(1f, 2f),
            Vec2(3f, 4f),
            Vec2(5f, 6f)
        )

        assertEquals(3, vectors.size)
        assertVec2Equals(Vec2(1f, 2f), vectors[0])
        assertVec2Equals(Vec2(3f, 4f), vectors[1])
        assertVec2Equals(Vec2(5f, 6f), vectors[2])
    }

    @Test
    fun testValueClass_mapUsage() {
        val vectorMap = mapOf(
            "origin" to Vec2.ZERO,
            "right" to Vec2.RIGHT,
            "up" to Vec2.UP
        )

        assertVec2Equals(Vec2.ZERO, vectorMap["origin"]!!)
        assertVec2Equals(Vec2.RIGHT, vectorMap["right"]!!)
        assertVec2Equals(Vec2.UP, vectorMap["up"]!!)
    }
}
