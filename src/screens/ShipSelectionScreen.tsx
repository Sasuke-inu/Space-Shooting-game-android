import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useI18nStore } from '../i18n';
import { useTheme } from '../theme';
import { useGameStore } from '../state/gameStore';
import { useUpgradesStore } from '../state/progressStore';
import { SHIP_STATS, ABILITY_STATS } from '../types/game';
import type { ShipType, AbilityType } from '../types/game';

const SHIP_COSTS: Record<ShipType, number> = {
  fighter: 0,
  scout: 500,
  tank: 750,
  interceptor: 1000,
};

const ABILITY_MAP: Record<ShipType, AbilityType> = {
  fighter: 'missile_barrage',
  scout: 'time_warp',
  tank: 'shield_burst',
  interceptor: 'emp_blast',
};

interface ShipSelectionScreenProps {
  onBack?: () => void;
  onShipSelected?: (ship: ShipType) => void;
}

export default function ShipSelectionScreen({ onBack, onShipSelected }: ShipSelectionScreenProps) {
  const theme = useTheme();
  const { t } = useI18nStore();

  const currentShip = useGameStore((s) => s.player.shipType);
  const setShipType = useGameStore((s) => s.setShipType);

  const credits = useUpgradesStore((s) => s.credits);
  const unlockedShips = useUpgradesStore((s) => s.unlockedShips);
  const isShipUnlocked = useUpgradesStore((s) => s.isShipUnlocked);
  const unlockShip = useUpgradesStore((s) => s.unlockShip);

  const [selectedShip, setSelectedShip] = useState<ShipType>(currentShip);

  const handleShipPress = (ship: ShipType) => {
    if (isShipUnlocked(ship)) {
      setSelectedShip(ship);
    } else {
      handleUnlockShip(ship);
    }
  };

  const handleUnlockShip = (ship: ShipType) => {
    const cost = SHIP_COSTS[ship];

    if (credits >= cost) {
      Alert.alert(
        t('general.confirm'),
        `Unlock ${t(`ships.${ship}.name`)} for ${cost} credits?`,
        [
          { text: t('general.cancel'), style: 'cancel' },
          {
            text: t('general.confirm'),
            onPress: () => {
              unlockShip(ship);
              setSelectedShip(ship);
              Alert.alert('Success', `${t(`ships.${ship}.name`)} unlocked!`);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Insufficient Credits',
        `You need ${cost - credits} more credits to unlock this ship.`
      );
    }
  };

  const handleConfirmSelection = () => {
    if (selectedShip !== currentShip && isShipUnlocked(selectedShip)) {
      setShipType(selectedShip);
      Alert.alert('Success', `Switched to ${t(`ships.${selectedShip}.name`)}`);
      onShipSelected?.(selectedShip);
    }
  };

  const renderShipCard = (ship: ShipType) => {
    const stats = SHIP_STATS[ship];
    const cost = SHIP_COSTS[ship];
    const isUnlocked = isShipUnlocked(ship);
    const isSelected = selectedShip === ship;
    const isCurrent = currentShip === ship;
    const abilityType = ABILITY_MAP[ship];
    const ability = ABILITY_STATS[abilityType];

    return (
      <TouchableOpacity
        key={ship}
        className="mb-4 p-4 rounded-lg border-2"
        style={{
          backgroundColor: isSelected
            ? theme.colors.panelBg
            : theme.colors.background,
          borderColor: isSelected
            ? theme.colors.buttonPrimary
            : theme.colors.panelBorder,
          opacity: isUnlocked ? 1 : 0.6,
        }}
        onPress={() => handleShipPress(ship)}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              {t(`ships.${ship}.name`)}
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textMuted }}
            >
              {t(`ships.${ship}.description`)}
            </Text>
          </View>

          {/* Status Badge */}
          <View className="ml-3">
            {isCurrent && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: theme.colors.buttonPrimary }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  CURRENT
                </Text>
              </View>
            )}
            {!isUnlocked && (
              <View
                className="px-3 py-1 rounded-full border"
                style={{
                  borderColor: theme.colors.panelBorder,
                  backgroundColor: theme.colors.panelBg,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {cost} 💰
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap mb-3">
          <View className="w-1/2 mb-2">
            <Text
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              Speed
            </Text>
            <View className="flex-row items-center mt-1">
              {renderStatBar(stats.speed)}
              <Text
                className="text-sm ml-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {(stats.speed * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <View className="w-1/2 mb-2">
            <Text
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              Fire Rate
            </Text>
            <View className="flex-row items-center mt-1">
              {renderStatBar(stats.fireRate)}
              <Text
                className="text-sm ml-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {(stats.fireRate * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <View className="w-1/2 mb-2">
            <Text
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              Damage
            </Text>
            <View className="flex-row items-center mt-1">
              {renderStatBar(stats.damage)}
              <Text
                className="text-sm ml-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {(stats.damage * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <View className="w-1/2 mb-2">
            <Text
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              Hull
            </Text>
            <View className="flex-row items-center mt-1">
              {renderStatBar(stats.hull / 150)}
              <Text
                className="text-sm ml-2"
                style={{ color: theme.colors.textSecondary }}
              >
                {stats.hull}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Ability */}
        <View
          className="p-3 rounded-lg"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Text
            className="text-xs font-semibold mb-1"
            style={{ color: theme.colors.textMuted }}
          >
            SPECIAL ABILITY
          </Text>
          <Text
            className="text-sm font-bold mb-1"
            style={{ color: theme.colors.buttonPrimary }}
          >
            {stats.special}
          </Text>
          <Text
            className="text-xs"
            style={{ color: theme.colors.textSecondary }}
          >
            {ability.description}
          </Text>
          <Text
            className="text-xs mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            Cooldown: {ability.cooldown}s
            {ability.duration > 0 && ` | Duration: ${ability.duration}s`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatBar = (value: number) => {
    const normalizedValue = Math.min(Math.max(value, 0), 2);
    const percentage = (normalizedValue / 2) * 100;

    return (
      <View
        className="h-2 rounded-full flex-1"
        style={{ backgroundColor: theme.colors.panelBorder }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: theme.colors.buttonPrimary,
          }}
        />
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        className="pt-12 pb-4 px-6 border-b"
        style={{
          backgroundColor: theme.colors.panelBg,
          borderBottomColor: theme.colors.panelBorder,
        }}
      >
        <View className="flex-row items-center justify-between">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="mr-4"
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: theme.colors.buttonPrimary }}
              >
                ← {t('general.back')}
              </Text>
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text
              className="text-3xl font-bold text-center"
              style={{ color: theme.colors.textPrimary }}
            >
              {t('menu.ships')}
            </Text>
          </View>
          {onBack && <View className="mr-4 opacity-0"><Text>←</Text></View>}
        </View>

        {/* Credits Display */}
        <View className="mt-4 flex-row items-center justify-center">
          <Text
            className="text-lg font-semibold"
            style={{ color: theme.colors.textSecondary }}
          >
            Credits:
          </Text>
          <Text
            className="text-lg font-bold ml-2"
            style={{ color: theme.colors.buttonPrimary }}
          >
            {credits} 💰
          </Text>
        </View>
      </View>

      {/* Ship List */}
      <ScrollView className="flex-1 px-6 py-4">
        {(['fighter', 'scout', 'tank', 'interceptor'] as ShipType[]).map(renderShipCard)}

        {/* Spacer for bottom button */}
        <View className="h-20" />
      </ScrollView>

      {/* Confirm Selection Button */}
      {selectedShip !== currentShip && isShipUnlocked(selectedShip) && (
        <View
          className="absolute bottom-0 left-0 right-0 p-6"
          style={{
            backgroundColor: theme.colors.panelBg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.panelBorder,
          }}
        >
          <TouchableOpacity
            className="py-4 rounded-lg"
            style={{ backgroundColor: theme.colors.buttonPrimary }}
            onPress={handleConfirmSelection}
          >
            <Text
              className="text-center text-lg font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Select {t(`ships.${selectedShip}.name`)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
