# Add project specific ProGuard rules here.

# Keep game entities
-keep class com.spaceshooter.domain.entity.** { *; }
-keep class com.spaceshooter.domain.model.** { *; }

# Keep Hilt
-keepclasseswithmembers class * {
    @dagger.hilt.* <methods>;
}

# Keep Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
