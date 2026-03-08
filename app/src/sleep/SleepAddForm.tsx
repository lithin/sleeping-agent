import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform, StyleSheet, View } from "react-native";
import {
    Button,
    Card,
    SegmentedButtons,
    Text,
    TextInput,
} from "react-native-paper";
import { getNowParts, toDateInput, toIso, toTimeInput } from "../helpers";
import type { Sleep, SleepFormValues } from "../types";
import { sleepSchema } from "../types";
import { useApi } from "../useApi";

type SleepAddFormProps = {
    onSaved: () => void;
};

const parseDateTime = (date: string, time: string) => {
    if (!date || !time) return new Date();
    return new Date(`${date}T${time}`);
};

export function SleepAddForm({ onSaved }: SleepAddFormProps) {
    const api = useApi();
    const nowParts = useMemo(() => getNowParts(), []);
    const [status, setStatus] = useState("");
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const { control, handleSubmit, reset, watch, setValue } =
        useForm<SleepFormValues>({
            resolver: zodResolver(sleepSchema),
            defaultValues: {
                start_date: nowParts.date,
                start_time: nowParts.time,
                end_date: "",
                end_time: "",
                type: "nap",
                notes: "",
            },
        });

    const startDate = watch("start_date");
    const startTime = watch("start_time");
    const endDate = watch("end_date");
    const endTime = watch("end_time");

    const submitSleep = handleSubmit(async (values) => {
        setStatus("");
        if (
            (values.end_date && !values.end_time) ||
            (!values.end_date && values.end_time)
        ) {
            setStatus("Both end date and end time are required if one is set");
            return;
        }

        try {
            const payload = {
                start_time: toIso(`${values.start_date}T${values.start_time}`),
                end_time:
                    values.end_date && values.end_time
                        ? toIso(`${values.end_date}T${values.end_time}`)
                        : undefined,
                type: values.type,
                notes: values.notes?.trim() || undefined,
            };

            await api.post<Sleep>("/sleeps", payload);

            const resetNow = getNowParts();
            reset({
                start_date: resetNow.date,
                start_time: resetNow.time,
                end_date: "",
                end_time: "",
                type: "nap",
                notes: "",
            });
            setStatus("Sleep saved.");
            onSaved();
        } catch (error) {
            setStatus(`Sleep error: ${(error as Error).message}`);
        }
    });

    return (
        <>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.cardTitle}>
                        New Sleep
                    </Text>

                    <Controller
                        control={control}
                        name="type"
                        render={({ field: { value, onChange } }) => (
                            <SegmentedButtons
                                value={value}
                                onValueChange={onChange}
                                buttons={[
                                    { value: "nap", label: "Nap" },
                                    { value: "night", label: "Night" },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        )}
                    />

                    <Text variant="labelLarge" style={styles.label}>
                        Start Time
                    </Text>
                    <View style={styles.dateTimeRow}>
                        <Button
                            mode="outlined"
                            onPress={() => setShowStartDatePicker(true)}
                            style={styles.dateButton}
                        >
                            {startDate || "Select Date"}
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => setShowStartTimePicker(true)}
                            style={styles.timeButton}
                        >
                            {startTime || "Select Time"}
                        </Button>
                    </View>

                    {showStartDatePicker && (
                        <DateTimePicker
                            value={parseDateTime(startDate, startTime || "12:00")}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowStartDatePicker(Platform.OS === "ios");
                                if (date) {
                                    setValue("start_date", toDateInput(date.toISOString()));
                                }
                            }}
                        />
                    )}

                    {showStartTimePicker && (
                        <DateTimePicker
                            value={parseDateTime(startDate || nowParts.date, startTime)}
                            mode="time"
                            display="default"
                            onChange={(event, date) => {
                                setShowStartTimePicker(Platform.OS === "ios");
                                if (date) {
                                    setValue("start_time", toTimeInput(date.toISOString()));
                                }
                            }}
                        />
                    )}

                    <Text variant="labelLarge" style={styles.label}>
                        End Time (Optional)
                    </Text>
                    <View style={styles.dateTimeRow}>
                        <Button
                            mode="outlined"
                            onPress={() => setShowEndDatePicker(true)}
                            style={styles.dateButton}
                        >
                            {endDate || "Select Date"}
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => setShowEndTimePicker(true)}
                            style={styles.timeButton}
                        >
                            {endTime || "Select Time"}
                        </Button>
                    </View>

                    {showEndDatePicker && (
                        <DateTimePicker
                            value={parseDateTime(
                                endDate || nowParts.date,
                                endTime || "12:00",
                            )}
                            mode="date"
                            display="default"
                            onChange={(event, date) => {
                                setShowEndDatePicker(Platform.OS === "ios");
                                if (date) {
                                    setValue("end_date", toDateInput(date.toISOString()));
                                }
                            }}
                        />
                    )}

                    {showEndTimePicker && (
                        <DateTimePicker
                            value={parseDateTime(
                                endDate || nowParts.date,
                                endTime || nowParts.time,
                            )}
                            mode="time"
                            display="default"
                            onChange={(event, date) => {
                                setShowEndTimePicker(Platform.OS === "ios");
                                if (date) {
                                    setValue("end_time", toTimeInput(date.toISOString()));
                                }
                            }}
                        />
                    )}

                    <Controller
                        control={control}
                        name="notes"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Notes (optional)"
                                value={value}
                                onChangeText={onChange}
                                style={styles.input}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                            />
                        )}
                    />

                    <Button
                        mode="contained"
                        onPress={submitSleep}
                        style={styles.submitButton}
                    >
                        Save Sleep
                    </Button>
                </Card.Content>
            </Card>

            {status ? (
                <Card style={styles.statusCard}>
                    <Card.Content>
                        <Text variant="bodyMedium">{status}</Text>
                    </Card.Content>
                </Card>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 12,
        fontWeight: "600",
    },
    segmentedButtons: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    dateTimeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    dateButton: {
        flex: 1,
    },
    timeButton: {
        flex: 1,
    },
    input: {
        marginBottom: 12,
    },
    submitButton: {
        marginTop: 8,
    },
    statusCard: {
        backgroundColor: "#e3f2fd",
        marginBottom: 16,
    },
});
