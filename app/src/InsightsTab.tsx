import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { useApi } from "./useApi";
import { usePullToRefresh } from "./usePullToRefresh";

type NextNapResponse = {
    sleepTime: string | null;
    confidence: number | null;
};

type AnalysisResponse = {
    analysis: string | null;
};

type InsightCardProps = {
    refreshToken: number;
    onRefreshSettled: (token: number) => void;
};

const formatLocalTime = (isoString: string | null) => {
    if (!isoString) {
        return null;
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
};

export default function InsightsTab() {
    const { refreshing, refreshToken, beginRefresh, settleRefresh } =
        usePullToRefresh(2);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={beginRefresh} />
            }
        >
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.title}>
                    Insights
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Personalized recommendations based on sleep patterns.
                </Text>

                <NextNapCard
                    key={`next-nap-${refreshToken}`}
                    refreshToken={refreshToken}
                    onRefreshSettled={settleRefresh}
                />
                <SleepTrendsCard
                    key={`sleep-trends-${refreshToken}`}
                    refreshToken={refreshToken}
                    onRefreshSettled={settleRefresh}
                />
            </View>
        </ScrollView>
    );
}

function NextNapCard({ refreshToken, onRefreshSettled }: InsightCardProps) {
    const api = useApi();
    const [sleepTime, setSleepTime] = useState<string | null>(null);
    const [confidence, setConfidence] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string>("");

    const loadNextNap = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const nextNap = await api.get<NextNapResponse>("/insights/next-nap");
            setSleepTime(nextNap.sleepTime ?? null);
            setConfidence(nextNap.confidence ?? null);
        } catch (error) {
            setError(`Next nap error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
            setLoaded(true);
            onRefreshSettled(refreshToken);
        }
    }, [api, onRefreshSettled, refreshToken]);

    useEffect(() => {
        void loadNextNap();
    }, [loadNextNap]);

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                    Next nap
                </Text>

                {loading && !loaded ? (
                    <Text variant="bodyMedium" style={styles.noData}>
                        Loading estimate...
                    </Text>
                ) : error ? (
                    <Text variant="bodyMedium" style={styles.errorText}>
                        {error}
                    </Text>
                ) : sleepTime ? (
                    <View>
                        <Text variant="bodyLarge" style={styles.timeText}>
                            {formatLocalTime(sleepTime)}
                        </Text>
                        <Text variant="bodySmall" style={styles.confidence}>
                            Confidence: {confidence !== null ? `${confidence}%` : "N/A"}
                        </Text>
                    </View>
                ) : (
                    <Text variant="bodyMedium" style={styles.noData}>
                        Not enough data.
                    </Text>
                )}

                {loading && loaded ? (
                    <Text variant="bodySmall" style={styles.refreshingText}>
                        Refreshing...
                    </Text>
                ) : null}
            </Card.Content>
        </Card>
    );
}

function SleepTrendsCard({ refreshToken, onRefreshSettled }: InsightCardProps) {
    const api = useApi();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string>("");

    const loadAnalysis = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const sleepAnalysis =
                await api.get<AnalysisResponse>("/insights/analysis");
            setAnalysis(sleepAnalysis.analysis ?? null);
        } catch (error) {
            setError(`Sleep trends error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
            setLoaded(true);
            onRefreshSettled(refreshToken);
        }
    }, [api, onRefreshSettled, refreshToken]);

    useEffect(() => {
        void loadAnalysis();
    }, [loadAnalysis]);

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                    Sleep trends
                </Text>
                {loading && !loaded ? (
                    <Text variant="bodyMedium" style={styles.noData}>
                        Loading analysis...
                    </Text>
                ) : error ? (
                    <Text variant="bodyMedium" style={styles.errorText}>
                        {error}
                    </Text>
                ) : analysis ? (
                    <Text variant="bodyMedium" style={styles.analysisText}>
                        {analysis}
                    </Text>
                ) : null}

                {!analysis && !loading && !error ? (
                    <Text variant="bodyMedium" style={styles.noData}>
                        Not enough data.
                    </Text>
                ) : null}

                {loading && loaded ? (
                    <Text variant="bodySmall" style={styles.refreshingText}>
                        Refreshing...
                    </Text>
                ) : null}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 16,
    },
    title: {
        marginBottom: 8,
        fontWeight: "bold",
    },
    subtitle: {
        marginBottom: 16,
        color: "#666",
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 8,
        fontWeight: "600",
    },
    timeText: {
        marginBottom: 4,
    },
    confidence: {
        color: "#666",
    },
    analysisText: {
        color: "#666",
    },
    noData: {
        color: "#666",
    },
    refreshingText: {
        marginTop: 8,
        color: "#666",
    },
    errorText: {
        color: "#b00020",
    },
});
