package com.spaceshooter.core.engine

import com.spaceshooter.core.math.Vec2
import com.spaceshooter.domain.entity.Asteroid
import com.spaceshooter.domain.entity.Boss
import com.spaceshooter.domain.entity.Enemy
import com.spaceshooter.domain.entity.PowerUp

/**
 * Spatial partitioning grid for optimizing collision detection.
 */
class SpatialGrid(private val width: Float, private val height: Float, private val cellSize: Float) {
    private val cols = (width / cellSize).toInt() + 2
    private val rows = (height / cellSize).toInt() + 2
    private val cells = Array(cols * rows) { ArrayList<GridEntry>() }

    fun clear() {
        for (i in cells.indices) {
            cells[i].clear()
        }
    }

    fun insert(asteroid: Asteroid, index: Int) {
        addToCells(asteroid.pos, asteroid.radius, GridEntry.Asteroid(index))
    }

    fun insert(enemy: Enemy, index: Int) {
        addToCells(enemy.pos, enemy.radius, GridEntry.Enemy(index))
    }

    fun insert(boss: Boss) {
        addToCells(boss.pos, boss.radius, GridEntry.Boss(boss))
    }
    
    fun insert(powerUp: PowerUp, index: Int) {
        addToCells(powerUp.pos, powerUp.radius, GridEntry.PowerUp(index))
    }

    private fun addToCells(pos: Vec2, radius: Float, entry: GridEntry) {
        val startX = ((pos.x - radius) / cellSize).toInt().coerceIn(0, cols - 1)
        val endX = ((pos.x + radius) / cellSize).toInt().coerceIn(0, cols - 1)
        val startY = ((pos.y - radius) / cellSize).toInt().coerceIn(0, rows - 1)
        val endY = ((pos.y + radius) / cellSize).toInt().coerceIn(0, rows - 1)

        for (y in startY..endY) {
            for (x in startX..endX) {
                cells[y * cols + x].add(entry)
            }
        }
    }

    fun retrieve(pos: Vec2, radius: Float): List<GridEntry> {
        val result = ArrayList<GridEntry>()
        val startX = ((pos.x - radius) / cellSize).toInt().coerceIn(0, cols - 1)
        val endX = ((pos.x + radius) / cellSize).toInt().coerceIn(0, cols - 1)
        val startY = ((pos.y - radius) / cellSize).toInt().coerceIn(0, rows - 1)
        val endY = ((pos.y + radius) / cellSize).toInt().coerceIn(0, rows - 1)
        
        // Use a set to avoid duplicates if an entity spans multiple cells
        val dedup = HashSet<GridEntry>()

        for (y in startY..endY) {
            for (x in startX..endX) {
                val cell = cells[y * cols + x]
                for (i in cell.indices) {
                    val entry = cell[i]
                    if (dedup.add(entry)) {
                        result.add(entry)
                    }
                }
            }
        }
        return result
    }

    sealed class GridEntry {
        data class Asteroid(val index: Int) : GridEntry()
        data class Enemy(val index: Int) : GridEntry()
        data class Boss(val boss: com.spaceshooter.domain.entity.Boss) : GridEntry()
        data class PowerUp(val index: Int) : GridEntry()
    }
}
