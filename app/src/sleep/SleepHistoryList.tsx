import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { formatDateGroupHeader, formatTime } from "../helpers";
import type { Sleep, SleepWake } from "../types";
import { useApi } from "../useApi";
import { SleepEditScreen } from "./SleepEditScreen";

type SleepHistoryListProps = {
    refreshToken: number;
    onRefreshSettled: (token: number) => void;
};

const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) {
        return "In progress";
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    if (Number.isNaN(diffMs) || diffMs <= 0) {
        return "";
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}hr ${minutes}min`;
    }
    if (hours > 0) {
        return `${hours}hr`;
    }
    return `${minutes}min`;
};

const getDurationMinutes = (startTime: string, endTime: string | null) => {
    if (!endTime) {
        return 0;
    }
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    if (Number.isNaN(diffMs) || diffMs <= 0) {
        return 0;
    }
    return Math.floor(diffMs / (1000 * 60));
};

const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}hr ${minutes}min`;
    }
    if (hours > 0) {
        return `${hours}hr`;
    }
    return `${minutes}min`;
};

const getGroupingDate = (sleep: Sleep) => {
    const sourceTime =
        sleep.type === "night" && sleep.endTime ? sleep.endTime : sleep.startTime;
    return new Date(sourceTime);
};

export function SleepHistoryList({
    refreshToken,
    onRefreshSettled,
}: SleepHistoryListProps) {
    const api = useApi();
    const [editingSleep, setEditingSleep] = useState<Sleep | null>(null);
    const [sleeps, setSleeps] = useState<Sleep[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");

    const loadSleeps = useCallback(
        async (token?: number) => {
            setLoading(true);
            setError("");
            try {
                const sleepData = await api.get<Sleep[]>("/sleeps");
                const sorted = sleepData.sort(
                    (a, b) =>
                        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
                );
                setSleeps(sorted);
            } catch (loadError) {
                setError(`Error loading sleeps: ${(loadError as Error).message}`);
            } finally {
                setLoading(false);
                setLoaded(true);
                if (typeof token === "number") {
                    onRefreshSettled(token);
                }
            }
        },
        [api, onRefreshSettled],
    );

    useEffect(() => {
        if (refreshToken > 0) {
            void loadSleeps(refreshToken);
            return;
        }

        void loadSleeps();
    }, [loadSleeps, refreshToken]);

    const groupedSleeps = useMemo(() => {
        const groups = new Map<string, { groupDate: Date; sleeps: Sleep[] }>();

        for (const sleep of sleeps) {
            const groupDate = getGroupingDate(sleep);
            const dateKey = groupDate.toLocaleDateString();
            const group = groups.get(dateKey);

            if (group) {
                group.sleeps.push(sleep);
            } else {
                groups.set(dateKey, { groupDate, sleeps: [sleep] });
            }
        }

        return Array.from(groups.values());
    }, [sleeps]);

    const handleSleepUpdated = (updated: Sleep) => {
        setEditingSleep((current) =>
            current && current.id === updated.id
                ? {
                    ...updated,
                    wakes: Array.isArray(updated.wakes) ? updated.wakes : [],
                }
                : current,
        );
        void loadSleeps();
    };

    const handleSleepDeleted = () => {
        setEditingSleep(null);
        void loadSleeps();
    };

    const handleWakeAdded = (sleepId: number, wake: SleepWake) => {
        setEditingSleep((current) =>
            current && current.id === sleepId
                ? { ...current, wakes: [...current.wakes, wake] }
                : current,
        );
        void loadSleeps();
    };

    const handleWakeDeleted = (sleepId: number, wakeId: number) => {
        setEditingSleep((current) =>
            current && current.id === sleepId
                ? { ...current, wakes: current.wakes.filter((w) => w.id !== wakeId) }
                : current,
        );
        void loadSleeps();
    };

    return (
        <>
            <Text variant="titleMedium" style={styles.historyTitle}>
                Sleep History
            </Text>

            {error ? (
                <Card style={styles.statusCard}>
                    <Card.Content>
                        <Text variant="bodyMedium">{error}</Text>
                    </Card.Content>
                </Card>
            ) : null}

            {!loading && loaded && sleeps.length === 0 ? (
                <Text variant="bodyMedium" style={styles.emptyText}>
                    No sleep entries yet.
                </Text>
            ) : null}

            {groupedSleeps.map((group) => (
                <View key={group.groupDate.toISOString()} style={styles.dateGroup}>
                    <View style={styles.dateHeaderRow}>
                        <Text variant="titleSmall" style={styles.dateHeader}>
                            {formatDateGroupHeader(group.groupDate)}
                        </Text>
                        <Text variant="bodySmall" style={styles.dayNapTotal}>
                            {formatMinutes(
                                group.sleeps
                                    .filter((sleep) => sleep.type === "nap")
                                    .reduce(
                                        (total, sleep) =>
                                            total +
                                            getDurationMinutes(sleep.startTime, sleep.endTime),
                                        0,
                                    ),
                            )}
                        </Text>
                    </View>
                    {group.sleeps.map((sleep) => (
                        <Card
                            key={sleep.id}
                            style={styles.sleepCard}
                            onPress={() => setEditingSleep(sleep)}
                        >
                            <Card.Content>
                                <View style={styles.sleepHeader}>
                                    <View style={styles.sleepHeaderLeft}>
                                        <Text variant="titleMedium">
                                            {sleep.type === "nap" ? "Nap" : "Night"}
                                        </Text>
                                        <Text variant="bodySmall" style={styles.sleepTime}>
                                            {formatTime(sleep.startTime)} -{" "}
                                            {formatTime(sleep.endTime)}
                                        </Text>
                                    </View>
                                    <View style={styles.sleepHeaderRight}>
                                        <Text variant="bodySmall" style={styles.sleepDuration}>
                                            {formatDuration(sleep.startTime, sleep.endTime)}
                                        </Text>
                                        {sleep.type === "night" ? (
                                            <Text variant="bodySmall" style={styles.wakeCount}>
                                                {Array.isArray(sleep.wakes) ? sleep.wakes.length : 0}{" "}
                                                {Array.isArray(sleep.wakes) && sleep.wakes.length === 1
                                                    ? "wake"
                                                    : "wakes"}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </View>
            ))}

            <Modal
                visible={editingSleep !== null}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setEditingSleep(null)}
            >
                {editingSleep ? (
                    <SleepEditScreen
                        editingSleep={editingSleep}
                        onSleepUpdated={handleSleepUpdated}
                        onSleepDeleted={handleSleepDeleted}
                        onWakeAdded={handleWakeAdded}
                        onWakeDeleted={handleWakeDeleted}
                        onClose={() => setEditingSleep(null)}
                    />
                ) : null}
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    historyTitle: {
        marginBottom: 12,
        fontWeight: "600",
    },
    statusCard: {
        backgroundColor: "#e3f2fd",
        marginBottom: 16,
    },
    emptyText: {
        color: "#666",
        marginBottom: 16,
    },
    dateGroup: {
        marginBottom: 16,
    },
    dateHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    dateHeader: {
        fontWeight: "600",
        color: "#333",
    },
    dayNapTotal: {
        color: "#666",
    },
    sleepCard: {
        marginBottom: 8,
    },
    sleepHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    sleepHeaderLeft: {
        flex: 1,
    },
    sleepHeaderRight: {
        marginLeft: 12,
        alignItems: "flex-end",
    },
    sleepTime: {
        color: "#666",
        marginTop: 4,
    },
    sleepDuration: {
        color: "#666",
        marginTop: 2,
    },
    wakeCount: {
        color: "#666",
        marginTop: 2,
    },
});
