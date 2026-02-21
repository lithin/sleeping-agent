import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Platform } from "react-native";
import {
    Button,
    Card,
    Text,
    TextInput,
    SegmentedButtons,
    IconButton,
    Appbar,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate, formatDateGroupHeader, formatTime, getNowParts, toDateInput, toIso, toTimeInput } from "./helpers";
import { useApi } from "./useApi";
import {
    type Sleep,
    type SleepFormValues,
    type SleepWake,
    sleepSchema,
} from "./types";

export default function SleepTab() {
    const [sleeps, setSleeps] = useState<Sleep[]>([]);
    const [status, setStatus] = useState("");
    const [editingSleep, setEditingSleep] = useState<Sleep | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
    const [showEditStartTimePicker, setShowEditStartTimePicker] = useState(false);
    const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
    const [showEditEndTimePicker, setShowEditEndTimePicker] = useState(false);
    const [newWakeTime, setNewWakeTime] = useState("");
    const [newWakeNotes, setNewWakeNotes] = useState("");
    const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
    const api = useApi();
    const nowParts = useMemo(() => getNowParts(), []);

    const { control, handleSubmit, reset, watch, setValue } = useForm<SleepFormValues>({
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
    const sleepType = watch("type");

    const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, watch: watchEdit, setValue: setEditValue } = useForm<SleepFormValues>({
        resolver: zodResolver(sleepSchema),
        defaultValues: {
            start_date: "",
            start_time: "",
            end_date: "",
            end_time: "",
            type: "nap",
            notes: "",
        },
    });

    const editStartDate = watchEdit("start_date");
    const editStartTime = watchEdit("start_time");
    const editEndDate = watchEdit("end_date");
    const editEndTime = watchEdit("end_time");
    const editSleepType = watchEdit("type");

    useEffect(() => {
        const load = async () => {
            try {
                const sleepData = await api.get<Sleep[]>("/sleeps");
                // Sort by startTime descending
                const sorted = sleepData.sort((a, b) =>
                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                );
                setSleeps(sorted);
            } catch (error) {
                setStatus(`Error loading sleeps: ${(error as Error).message}`);
            }
        };

        void load();
    }, [api]);

    // Group sleeps by date
    const groupedSleeps = useMemo(() => {
        const groups: Record<string, Sleep[]> = {};
        for (const sleep of sleeps) {
            const date = new Date(sleep.startTime);
            const dateKey = date.toLocaleDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(sleep);
        }
        return groups;
    }, [sleeps]);

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
            const created = await api.post<Sleep>("/sleeps", payload);
            const safeCreated = {
                ...created,
                wakes: Array.isArray(created.wakes) ? created.wakes : [],
            };
            setSleeps((current) => [safeCreated, ...current]);
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
        } catch (error) {
            setStatus(`Sleep error: ${(error as Error).message}`);
        }
    });

    const deleteSleep = async (id: number) => {
        try {
            await api.delete(`/sleeps/${id}`);
            setSleeps((current) => current.filter((s) => s.id !== id));
            setStatus("Sleep deleted.");
            setEditingSleep(null);
        } catch (error) {
            setStatus(`Delete error: ${(error as Error).message}`);
        }
    };

    const openEditModal = (sleep: Sleep) => {
        const startDt = new Date(sleep.startTime);
        const endDt = sleep.endTime ? new Date(sleep.endTime) : null;
        resetEdit({
            start_date: toDateInput(sleep.startTime),
            start_time: toTimeInput(sleep.startTime),
            end_date: endDt ? toDateInput(sleep.endTime) : "",
            end_time: endDt ? toTimeInput(sleep.endTime) : "",
            type: sleep.type,
            notes: sleep.notes || "",
        });
        setEditingSleep(sleep);
    };

    const updateSleep = handleEditSubmit(async (values) => {
        if (!editingSleep) return;
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
            const updated = await api.put<Sleep>(`/sleeps/${editingSleep.id}`, payload);
            const safeUpdated = {
                ...updated,
                wakes: Array.isArray(updated.wakes) ? updated.wakes : [],
            };
            setSleeps((current) =>
                current.map((s) => (s.id === editingSleep.id ? safeUpdated : s))
            );
            setStatus("Sleep updated.");
            setEditingSleep(null);
        } catch (error) {
            setStatus(`Update error: ${(error as Error).message}`);
        }
    });

    const parseDateTime = (date: string, time: string) => {
        if (!date || !time) return new Date();
        return new Date(`${date}T${time}`);
    };

    const addWake = async () => {
        if (!editingSleep || !newWakeTime) return;
        setStatus("");

        // Infer date from sleep start/end times
        const startDate = new Date(editingSleep.startTime);
        const endDate = editingSleep.endTime ? new Date(editingSleep.endTime) : new Date();

        // Parse the time
        const [hours, minutes] = newWakeTime.split(":").map(Number);

        // Start with the start date
        const wakeDateTime = new Date(startDate);
        wakeDateTime.setHours(hours, minutes, 0, 0);

        // If the wake time is before start time, it must be on the next day
        if (wakeDateTime < startDate) {
            wakeDateTime.setDate(wakeDateTime.getDate() + 1);
        }

        // If we have an end time and wake is after it, cap it at end time
        if (editingSleep.endTime && wakeDateTime > endDate) {
            setStatus("Wake time cannot be after sleep end time");
            return;
        }

        try {
            const wake = await api.post<SleepWake>("/sleep-wakes", {
                sleep_id: editingSleep.id,
                timestamp: toIso(wakeDateTime.toISOString()),
                notes: newWakeNotes.trim() || undefined,
            });

            setEditingSleep({
                ...editingSleep,
                wakes: [...editingSleep.wakes, wake],
            });

            setSleeps((current) =>
                current.map((s) =>
                    s.id === editingSleep.id
                        ? { ...s, wakes: [...s.wakes, wake] }
                        : s
                )
            );

            setNewWakeTime("");
            setNewWakeNotes("");
            setStatus("Wake added.");
        } catch (error) {
            setStatus(`Wake error: ${(error as Error).message}`);
        }
    };

    const deleteWake = async (wakeId: number) => {
        if (!editingSleep) return;
        setStatus("");

        try {
            await api.delete(`/sleep-wakes/${wakeId}`);

            setEditingSleep({
                ...editingSleep,
                wakes: editingSleep.wakes.filter((w) => w.id !== wakeId),
            });

            setSleeps((current) =>
                current.map((s) =>
                    s.id === editingSleep.id
                        ? { ...s, wakes: s.wakes.filter((w) => w.id !== wakeId) }
                        : s
                )
            );

            setStatus("Wake deleted.");
        } catch (error) {
            setStatus(`Delete wake error: ${(error as Error).message}`);
        }
    };

    // Show edit screen if editing a sleep
    if (editingSleep) {
        return (
            <View style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => setEditingSleep(null)} />
                    <Appbar.Content title="Edit Sleep" />
                </Appbar.Header>
                <ScrollView style={styles.content}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Controller
                                control={editControl}
                                name="type"
                                render={({ field: { onChange, value } }) => (
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

                            <Text variant="labelMedium" style={styles.label}>
                                Start Date & Time
                            </Text>
                            <View style={styles.dateTimeRow}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowEditStartDatePicker(true)}
                                    style={styles.dateButton}
                                >
                                    {editStartDate || "Date"}
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowEditStartTimePicker(true)}
                                    style={styles.timeButton}
                                >
                                    {editStartTime || "Time"}
                                </Button>
                            </View>

                            {showEditStartDatePicker && (
                                <DateTimePicker
                                    value={parseDateTime(editStartDate || nowParts.date, editStartTime || nowParts.time)}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowEditStartDatePicker(Platform.OS === "ios");
                                        if (date) {
                                            setEditValue("start_date", toDateInput(date.toISOString()));
                                        }
                                    }}
                                />
                            )}

                            {showEditStartTimePicker && (
                                <DateTimePicker
                                    value={parseDateTime(editStartDate || nowParts.date, editStartTime || nowParts.time)}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowEditStartTimePicker(Platform.OS === "ios");
                                        if (date) {
                                            setEditValue("start_time", toTimeInput(date.toISOString()));
                                        }
                                    }}
                                />
                            )}

                            <Text variant="labelMedium" style={styles.label}>
                                End Date & Time (optional)
                            </Text>
                            <View style={styles.dateTimeRow}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowEditEndDatePicker(true)}
                                    style={styles.dateButton}
                                >
                                    {editEndDate || "Date"}
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowEditEndTimePicker(true)}
                                    style={styles.timeButton}
                                >
                                    {editEndTime || "Time"}
                                </Button>
                            </View>

                            {showEditEndDatePicker && (
                                <DateTimePicker
                                    value={parseDateTime(editEndDate || nowParts.date, editEndTime || nowParts.time)}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowEditEndDatePicker(Platform.OS === "ios");
                                        if (date) {
                                            setEditValue("end_date", toDateInput(date.toISOString()));
                                        }
                                    }}
                                />
                            )}

                            {showEditEndTimePicker && (
                                <DateTimePicker
                                    value={parseDateTime(editEndDate || nowParts.date, editEndTime || nowParts.time)}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowEditEndTimePicker(Platform.OS === "ios");
                                        if (date) {
                                            setEditValue("end_time", toTimeInput(date.toISOString()));
                                        }
                                    }}
                                />
                            )}

                            <Controller
                                control={editControl}
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

                            {status ? (
                                <Card style={styles.statusCard}>
                                    <Card.Content>
                                        <Text variant="bodyMedium">{status}</Text>
                                    </Card.Content>
                                </Card>
                            ) : null}

                            <Text variant="titleMedium" style={styles.wakesTitle}>
                                Wakes
                            </Text>

                            {editingSleep.wakes.length > 0 ? (
                                <View style={styles.wakesList}>
                                    {editingSleep.wakes.map((wake) => (
                                        <Card key={wake.id} style={styles.wakeCard}>
                                            <Card.Content>
                                                <View style={styles.wakeRow}>
                                                    <View style={styles.wakeContent}>
                                                        <Text variant="bodyMedium">
                                                            {formatTime(wake.timestamp)}
                                                        </Text>
                                                        {wake.notes && (
                                                            <Text variant="bodySmall" style={styles.wakeNotes}>
                                                                {wake.notes}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <IconButton
                                                        icon="delete"
                                                        size={16}
                                                        onPress={() => deleteWake(wake.id)}
                                                    />
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    ))}
                                </View>
                            ) : (
                                <Text variant="bodySmall" style={styles.noWakes}>
                                    No wakes recorded
                                </Text>
                            )}

                            <Text variant="labelMedium" style={styles.label}>
                                Add Wake Time
                            </Text>
                            <View style={styles.wakeInputRow}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowWakeTimePicker(true)}
                                    style={styles.wakeTimeButton}
                                >
                                    {newWakeTime || "Select Time"}
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={addWake}
                                    disabled={!newWakeTime}
                                    style={styles.addWakeButton}
                                >
                                    Add
                                </Button>
                            </View>

                            <TextInput
                                label="Wake notes (optional)"
                                value={newWakeNotes}
                                onChangeText={setNewWakeNotes}
                                style={styles.input}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                            />

                            {showWakeTimePicker && (
                                <DateTimePicker
                                    value={newWakeTime ? parseDateTime(editStartDate || nowParts.date, newWakeTime) : new Date()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowWakeTimePicker(Platform.OS === "ios");
                                        if (date) {
                                            setNewWakeTime(toTimeInput(date.toISOString()));
                                        }
                                    }}
                                />
                            )}

                            <Button mode="contained" onPress={updateSleep} style={styles.submitButton}>
                                Save Changes
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={() => editingSleep && deleteSleep(editingSleep.id)}
                                style={styles.deleteButton}
                                textColor="#d32f2f"
                            >
                                Delete Sleep
                            </Button>
                        </Card.Content>
                    </Card>
                </ScrollView>
            </View>
        );
    }

    // Main list view
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.title}>
                    Track Sleep
                </Text>

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
                                value={parseDateTime(endDate || nowParts.date, endTime || "12:00")}
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
                                value={parseDateTime(endDate || nowParts.date, endTime || nowParts.time)}
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

                        <Button mode="contained" onPress={submitSleep} style={styles.submitButton}>
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

                <Text variant="titleMedium" style={styles.historyTitle}>
                    Sleep History
                </Text>

                {Object.entries(groupedSleeps).map(([dateKey, dateSleeps]) => (
                    <View key={dateKey} style={styles.dateGroup}>
                        <Text variant="titleSmall" style={styles.dateHeader}>
                            {formatDateGroupHeader(new Date(dateSleeps[0].startTime))}
                        </Text>
                        {dateSleeps.map((sleep) => (
                            <Card key={sleep.id} style={styles.sleepCard} onPress={() => openEditModal(sleep)}>
                                <Card.Content>
                                    <View style={styles.sleepHeader}>
                                        <View style={styles.sleepHeaderLeft}>
                                            <Text variant="titleMedium">{sleep.type === "nap" ? "Nap" : "Night"}</Text>
                                            <Text variant="bodySmall" style={styles.sleepTime}>
                                                {formatTime(sleep.startTime)} - {formatTime(sleep.endTime)}
                                            </Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                ))}
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
        marginBottom: 16,
        fontWeight: "bold",
    },
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
    historyTitle: {
        marginBottom: 12,
        fontWeight: "600",
    },
    dateGroup: {
        marginBottom: 16,
    },
    dateHeader: {
        marginBottom: 8,
        fontWeight: "600",
        color: "#333",
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
    sleepTime: {
        color: "#666",
        marginTop: 4,
    },
    deleteButton: {
        marginTop: 16,
        borderColor: "#d32f2f",
    },
    wakesTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: "600",
    },
    wakesList: {
        marginBottom: 12,
    },
    wakeCard: {
        marginBottom: 6,
        backgroundColor: "#f9f9f9",
    },
    wakeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    wakeContent: {
        flex: 1,
    },
    wakeNotes: {
        color: "#666",
        marginTop: 4,
        fontStyle: "italic",
    },
    noWakes: {
        color: "#999",
        marginBottom: 12,
        fontStyle: "italic",
    },
    wakeInputRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    wakeTimeButton: {
        flex: 1,
    },
    addWakeButton: {
        paddingHorizontal: 16,
    },
});
