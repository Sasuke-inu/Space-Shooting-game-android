import React from "react"
import { View, Text, Modal, Pressable, ScrollView } from "react-native"
import { format } from "date-fns"
import { useThemeColors } from "../theme/themeStore"
import { useWeeklyEventsStore } from "../state/weeklyEventsStore"
import { useI18nStore } from "../i18n/store"

interface EventLeaderboardModalProps {
  visible: boolean
  onClose: () => void
  eventId: string
}

export function EventLeaderboardModal({
  visible,
  onClose,
  eventId,
}: EventLeaderboardModalProps) {
  const colors = useThemeColors()
  const t = useI18nStore((s) => s.t)
  const currentEvent = useWeeklyEventsStore((s) => s.currentEvent)
  const getLeaderboard = useWeeklyEventsStore((s) => s.getLeaderboard)

  const leaderboard = getLeaderboard(eventId)
  const entries = leaderboard?.entries || []
  const playerEntry = leaderboard?.playerEntry

  // Get event name for header
  const eventName =
    currentEvent?.id === eventId ? currentEvent.name : "Event Leaderboard"

  return (
    <Modal visible={visible} transparent animationType="fade">
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
        >
          {/* Header */}
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            🏆 {eventName}
          </Text>

          {/* Subheader */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {t("weeklyEvent.leaderboard")}
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
          >
            {entries.length === 0 ? (
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
              entries.map((entry, index) => {
                const isPlayerEntry = playerEntry?.playerId === entry.playerId
                const isTopThree = index < 3

                return (
                  <View
                    key={`${entry.playerId}-${entry.timestamp}`}
                    style={{
                      flexDirection: "column",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 4,
                      backgroundColor: isPlayerEntry
                        ? `${colors.hudAccent}30`
                        : isTopThree
                          ? `${colors.hudAccent}10`
                          : colors.buttonSecondary,
                      borderRadius: 8,
                      borderWidth: isPlayerEntry ? 2 : 0,
                      borderColor: isPlayerEntry ? colors.hudAccent : "transparent",
                    }}
                  >
                    {/* Top Row: Rank, Name, Score, Wave */}
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          color:
                            index === 0
                              ? colors.hudAccent
                              : isPlayerEntry
                                ? colors.hudAccent
                                : colors.textPrimary,
                          fontSize: 16,
                          fontWeight: "bold",
                          width: 40,
                        }}
                      >
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `#${index + 1}`}
                      </Text>
                      <Text
                        style={{
                          color: isPlayerEntry
                            ? colors.hudAccent
                            : colors.textPrimary,
                          fontSize: 14,
                          fontWeight: isPlayerEntry ? "bold" : "600",
                          flex: 1,
                        }}
                      >
                        {entry.playerName}
                        {isPlayerEntry ? " (You)" : ""}
                      </Text>
                      <Text
                        style={{
                          color: colors.hudAccent,
                          fontSize: 16,
                          fontWeight: "bold",
                          width: 70,
                          textAlign: "right",
                        }}
                      >
                        {entry.score.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 14,
                          width: 50,
                          textAlign: "center",
                        }}
                      >
                        {entry.wave}
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
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          flex: 1,
                        }}
                      >
                        🚀{" "}
                        {entry.shipType.charAt(0).toUpperCase() +
                          entry.shipType.slice(1)}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                        }}
                      >
                        {format(new Date(entry.timestamp), "MMM d, yyyy")}
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
