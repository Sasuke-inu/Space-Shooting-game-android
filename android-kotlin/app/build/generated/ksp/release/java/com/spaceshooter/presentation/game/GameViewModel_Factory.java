package com.spaceshooter.presentation.game;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class GameViewModel_Factory implements Factory<GameViewModel> {
  @Override
  public GameViewModel get() {
    return newInstance();
  }

  public static GameViewModel_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static GameViewModel newInstance() {
    return new GameViewModel();
  }

  private static final class InstanceHolder {
    private static final GameViewModel_Factory INSTANCE = new GameViewModel_Factory();
  }
}
