import React from "react"
import { View, Text, Modal, Pressable, ScrollView } from "react-native"
import { format } from "date-fns"
import { useThemeColors } from "../theme/themeStore"
import { useHighScoresStore } from "../state/highScoresStore"
import { useI18nStore } from "../i18n/store"

interface LeaderboardModalProps {
  visible: boolean
  onClose: () => void
}

export function LeaderboardModal({ visible, onClose }: LeaderboardModalProps) {
  const colors = useThemeColors()
  const scores = useHighScoresStore((s) => s.scores)
  const t = useI18nStore((s) => s.t)

  return (
    <Modal visible={visible} transparent animationType="fade" accessibilityViewIsModal>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.modalOverlay,
        }}
      >
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderWidth: 2,
            borderColor: colors.panelBorder,
            borderRadius: 16,
            padding: 20,
            marginHorizontal: 24,
            width: 380,
            maxHeight: "85%",
          }}
          accessibilityRole="dialog"
          accessibilityLabel="Leaderboard dialog"
        >
          {/* Header */}
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
            }}
            accessibilityRole="header"
          >
            🏆 {t("leaderboard.title")}
          </Text>

          {/* Column Headers */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: colors.buttonSecondary,
              borderRadius: 8,
              marginBottom: 8,
            }}
            accessibilityRole="header"
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                width: 40,
              }}
            >
              {t("leaderboard.rank")}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {t("leaderboard.name")}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                width: 70,
                textAlign: "right",
              }}
            >
              {t("leaderboard.score")}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: "600",
                width: 50,
                textAlign: "center",
              }}
            >
              {t("leaderboard.wave")}
            </Text>
          </View>

          {/* Scores List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 400 }}
            accessibilityLabel="High scores list"
          >
            {scores.length === 0 ? (
              <View
                style={{
                  paddingVertical: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  {t("leaderboard.noScores")}
                </Text>
              </View>
            ) : (
              scores.map((score, index) => {
                const rankText = index === 0 ? "First place" : index === 1 ? "Second place" : index === 2 ? "Third place" : `Rank ${index + 1}`
                const shipName = score.ship.charAt(0).toUpperCase() + score.ship.slice(1)
                const dateText = format(new Date(score.date), "MMM d, yyyy")

                return (
                  <View
                    key={`${score.date}-${index}`}
                    style={{
                      flexDirection: "column",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 4,
                      backgroundColor:
                        index === 0
                          ? `${colors.accent}20`
                          : colors.buttonSecondary,
                      borderRadius: 8,
                      borderWidth: index === 0 ? 2 : 0,
                      borderColor: index === 0 ? colors.accent : "transparent",
                    }}
                    accessible={true}
                    accessibilityLabel={`${rankText}: ${score.name} with ${score.score.toLocaleString()} points, wave ${score.wave}, using ${shipName} ship, achieved on ${dateText}`}
                  >
                    {/* Top Row: Rank, Name, Score, Wave */}
                    <View style={{ flexDirection: "row", alignItems: "center" }} importantForAccessibility="no-hide-descendants">
                      <Text
                        style={{
                          color: index === 0 ? colors.accent : colors.textPrimary,
                          fontSize: 16,
                          fontWeight: "bold",
                          width: 40,
                        }}
                      >
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </Text>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 14,
                          fontWeight: "600",
                          flex: 1,
                        }}
                      >
                        {score.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.accent,
                          fontSize: 16,
                          fontWeight: "bold",
                          width: 70,
                          textAlign: "right",
                        }}
                      >
                        {score.score.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 14,
                          width: 50,
                          textAlign: "center",
                        }}
                      >
                        {score.wave}
                      </Text>
                    </View>

                    {/* Bottom Row: Ship and Date */}
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 4,
                        marginLeft: 40,
                        alignItems: "center",
                      }}
                      importantForAccessibility="no-hide-descendants"
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          flex: 1,
                        }}
                      >
                        🚀 {shipName}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                        }}
                      >
                        {dateText}
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: colors.buttonPrimary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginTop: 16,
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("leaderboard.close")}
            accessibilityHint="Close leaderboard dialog"
          >
            <Text
              style={{
                color: colors.buttonText,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {t("leaderboard.close")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
