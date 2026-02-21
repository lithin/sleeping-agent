import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useApi } from "./useApi";

type NextNapResponse = {
    sleepTime: string | null;
    confidence: number | null;
};

type AnalysisResponse = {
    analysis: string | null;
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
    const api = useApi();
    const [sleepTime, setSleepTime] = useState<string | null>(null);
    const [confidence, setConfidence] = useState<number | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadInsights = async () => {
        setLoading(true);
        setStatus("");
        try {
            const [nextNap, sleepAnalysis] = await Promise.all([
                api.get<NextNapResponse>("/insights/next-nap"),
                api.get<AnalysisResponse>("/insights/analysis"),
            ]);
            setSleepTime(nextNap.sleepTime ?? null);
            setConfidence(nextNap.confidence ?? null);
            setAnalysis(sleepAnalysis.analysis ?? null);
        } catch (error) {
            setStatus(`Insights error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    };

    useEffect(() => {
        void loadInsights();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.title}>
                    Insights
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Personalized recommendations based on sleep patterns.
                </Text>

                <Button
                    mode="outlined"
                    onPress={loadInsights}
                    disabled={loading}
                    style={styles.button}
                >
                    {loading ? "Refreshing..." : "Refresh insights"}
                </Button>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Next nap
                        </Text>
                        {sleepTime ? (
                            <View>
                                <Text variant="bodyLarge" style={styles.timeText}>
                                    {formatLocalTime(sleepTime)}
                                </Text>
                                <Text variant="bodySmall" style={styles.confidence}>
                                    Confidence: {confidence !== null ? `${confidence}%` : "N/A"}
                                </Text>
                            </View>
                        ) : loaded ? (
                            <Text variant="bodyMedium" style={styles.noData}>
                                Not enough data.
                            </Text>
                        ) : (
                            <Text variant="bodyMedium" style={styles.noData}>
                                Loading estimate...
                            </Text>
                        )}

                        <View style={styles.divider} />

                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Sleep trends
                        </Text>
                        {analysis ? (
                            <Text variant="bodyMedium" style={styles.analysisText}>
                                {analysis}
                            </Text>
                        ) : loaded ? (
                            <Text variant="bodyMedium" style={styles.noData}>
                                Not enough data.
                            </Text>
                        ) : (
                            <Text variant="bodyMedium" style={styles.noData}>
                                Loading analysis...
                            </Text>
                        )}
                    </Card.Content>
                </Card>

                {status ? (
                    <Card style={styles.statusCard}>
                        <Card.Content>
                            <Text variant="bodyMedium">{status}</Text>
                        </Card.Content>
                    </Card>
                ) : null}
            </View>
        </ScrollView>
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
    button: {
        marginBottom: 16,
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
    divider: {
        height: 16,
        marginVertical: 16,
    },
    analysisText: {
        color: "#666",
    },
    noData: {
        color: "#666",
    },
    statusCard: {
        backgroundColor: "#e3f2fd",
    },
});
