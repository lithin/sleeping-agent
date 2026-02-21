import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
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
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Insights
                    </Typography>
                    <Typography color="text.secondary">
                        Personalized recommendations based on sleep patterns.
                    </Typography>
                </Box>

                <Button variant="outlined" onClick={loadInsights} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh insights"}
                </Button>

                <Paper variant="outlined" sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle1">
                                Next nap
                            </Typography>
                            {sleepTime ? (
                                <>
                                    <Typography sx={{ mb: 1 }}>
                                        {formatLocalTime(sleepTime)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Confidence: {confidence !== null ? `${confidence}%` : 'N/A'}
                                    </Typography>
                                </>
                            ) : loaded ? (
                                <Typography color="text.secondary">
                                    Not enough data.
                                </Typography>
                            ) : (
                                <Typography color="text.secondary">
                                    Loading estimate...
                                </Typography>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="subtitle1">
                                Sleep trends
                            </Typography>
                            {analysis ? (
                                <Typography variant="body2" color="text.secondary">
                                    {analysis}
                                </Typography>
                            ) : loaded ? (
                                <Typography color="text.secondary">
                                    Not enough data.
                                </Typography>
                            ) : (
                                <Typography color="text.secondary">
                                    Loading analysis...
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Paper>

                {status ? (
                    <Alert severity="info">{status}</Alert>
                ) : null}
            </Stack>
        </Box>
    );
}
