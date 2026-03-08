import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
    Appbar,
    Button,
    Card,
    IconButton,
    SegmentedButtons,
    Text,
    TextInput,
} from "react-native-paper";
import {
    formatTime,
    getNowParts,
    toDateInput,
    toIso,
    toTimeInput,
} from "../helpers";
import type { Sleep, SleepFormValues, SleepWake } from "../types";
import { sleepSchema } from "../types";
import { useApi } from "../useApi";

type SleepEditScreenProps = {
    editingSleep: Sleep;
    onSleepUpdated: (updated: Sleep) => void;
    onSleepDeleted: (sleepId: number) => void;
    onWakeAdded: (sleepId: number, wake: SleepWake) => void;
    onWakeDeleted: (sleepId: number, wakeId: number) => void;
    onClose: () => void;
};

const parseDateTime = (date: string, time: string) => {
    if (!date || !time) return new Date();
    return new Date(`${date}T${time}`);
};

export function SleepEditScreen({
    editingSleep,
    onSleepUpdated,
    onSleepDeleted,
    onWakeAdded,
    onWakeDeleted,
    onClose,
}: SleepEditScreenProps) {
    const api = useApi();
    const nowParts = useMemo(() => getNowParts(), []);
    const [sleepStatus, setSleepStatus] = useState("");
    const [wakeStatus, setWakeStatus] = useState("");
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [newWakeTime, setNewWakeTime] = useState("");
    const [newWakeNotes, setNewWakeNotes] = useState("");
    const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

    const { control, handleSubmit, reset, watch, setValue } =
        useForm<SleepFormValues>({
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

    const editStartDate = watch("start_date") || "";
    const editStartTime = watch("start_time") || "";
    const editEndDate = watch("end_date") || "";
    const editEndTime = watch("end_time") || "";
    const editSleepType = watch("type");

    useEffect(() => {
        const endDt = editingSleep.endTime ? new Date(editingSleep.endTime) : null;
        reset({
            start_date: toDateInput(editingSleep.startTime),
            start_time: toTimeInput(editingSleep.startTime),
            end_date: endDt ? toDateInput(editingSleep.endTime as string) : "",
            end_time: endDt ? toTimeInput(editingSleep.endTime as string) : "",
            type: editingSleep.type,
            notes: editingSleep.notes || "",
        });
        setSleepStatus("");
        setWakeStatus("");
        setShowStartDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndDatePicker(false);
        setShowEndTimePicker(false);
        setShowWakeTimePicker(false);
        setNewWakeTime("");
        setNewWakeNotes("");
    }, [editingSleep, reset]);

    useEffect(() => {
        if (editSleepType !== "night") {
            setShowWakeTimePicker(false);
            setNewWakeTime("");
            setNewWakeNotes("");
        }
    }, [editSleepType]);

    const saveChanges = handleSubmit(async (values) => {
        setSleepStatus("");
        if (
            (values.end_date && !values.end_time) ||
            (!values.end_date && values.end_time)
        ) {
            setSleepStatus("Both end date and end time are required if one is set");
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
            const updated = await api.put<Sleep>(
                `/sleeps/${editingSleep.id}`,
                payload,
            );
            const safeUpdated = {
                ...updated,
                wakes: Array.isArray(updated.wakes) ? updated.wakes : [],
            };
            onSleepUpdated(safeUpdated);
            onClose();
        } catch (error) {
            setSleepStatus(`Update error: ${(error as Error).message}`);
        }
    });

    const deleteSleep = async () => {
        setSleepStatus("");
        try {
            await api.delete(`/sleeps/${editingSleep.id}`);
            onSleepDeleted(editingSleep.id);
            onClose();
        } catch (error) {
            setSleepStatus(`Delete error: ${(error as Error).message}`);
        }
    };

    const addWake = async () => {
        if (!newWakeTime || editSleepType !== "night") return;
        setWakeStatus("");

        const startDate = new Date(editingSleep.startTime);
        const endDate = editingSleep.endTime
            ? new Date(editingSleep.endTime)
            : new Date();
        const [hours, minutes] = newWakeTime.split(":").map(Number);
        const wakeDateTime = new Date(startDate);
        wakeDateTime.setHours(hours, minutes, 0, 0);

        if (wakeDateTime < startDate) {
            wakeDateTime.setDate(wakeDateTime.getDate() + 1);
        }

        if (editingSleep.endTime && wakeDateTime > endDate) {
            setWakeStatus("Wake time cannot be after sleep end time");
            return;
        }

        try {
            const wake = await api.post<SleepWake>("/sleep-wakes", {
                sleep_id: editingSleep.id,
                timestamp: toIso(wakeDateTime.toISOString()),
                notes: newWakeNotes.trim() || undefined,
            });
            onWakeAdded(editingSleep.id, wake);
            setNewWakeTime("");
            setNewWakeNotes("");
            setWakeStatus("Wake added.");
        } catch (error) {
            setWakeStatus(`Wake error: ${(error as Error).message}`);
        }
    };

    const deleteWake = async (wakeId: number) => {
        if (editSleepType !== "night") return;
        setWakeStatus("");
        try {
            await api.delete(`/sleep-wakes/${wakeId}`);
            onWakeDeleted(editingSleep.id, wakeId);
            setWakeStatus("Wake deleted.");
        } catch (error) {
            setWakeStatus(`Delete wake error: ${(error as Error).message}`);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Edit Sleep" />
            </Appbar.Header>
            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Controller
                            control={control}
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
                                onPress={() => setShowStartDatePicker(true)}
                                style={styles.dateButton}
                            >
                                {editStartDate || "Date"}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowStartTimePicker(true)}
                                style={styles.timeButton}
                            >
                                {editStartTime || "Time"}
                            </Button>
                        </View>

                        {showStartDatePicker && (
                            <DateTimePicker
                                value={parseDateTime(
                                    editStartDate || nowParts.date,
                                    editStartTime || nowParts.time,
                                )}
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
                                value={parseDateTime(
                                    editStartDate || nowParts.date,
                                    editStartTime || nowParts.time,
                                )}
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

                        <Text variant="labelMedium" style={styles.label}>
                            End Date & Time (optional)
                        </Text>
                        <View style={styles.dateTimeRow}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowEndDatePicker(true)}
                                style={styles.dateButton}
                            >
                                {editEndDate || "Date"}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowEndTimePicker(true)}
                                style={styles.timeButton}
                            >
                                {editEndTime || "Time"}
                            </Button>
                        </View>

                        {showEndDatePicker && (
                            <DateTimePicker
                                value={parseDateTime(
                                    editEndDate || nowParts.date,
                                    editEndTime || nowParts.time,
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
                                    editEndDate || nowParts.date,
                                    editEndTime || nowParts.time,
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

                        {sleepStatus ? (
                            <Card style={styles.statusCard}>
                                <Card.Content>
                                    <Text variant="bodyMedium">{sleepStatus}</Text>
                                </Card.Content>
                            </Card>
                        ) : null}

                        <View style={styles.actionsSection}>
                            <Button
                                mode="contained"
                                onPress={saveChanges}
                                style={styles.submitButton}
                            >
                                Save Changes
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={deleteSleep}
                                style={styles.deleteButton}
                                textColor="#d32f2f"
                            >
                                Delete Sleep
                            </Button>
                        </View>

                        {editSleepType === "night" ? (
                            <View style={styles.wakesSection}>
                                <View style={styles.sectionDivider} />
                                <Text variant="titleMedium" style={styles.wakesTitle}>
                                    Wakes
                                </Text>

                                {wakeStatus ? (
                                    <Card style={styles.wakeStatusCard}>
                                        <Card.Content>
                                            <Text variant="bodyMedium">{wakeStatus}</Text>
                                        </Card.Content>
                                    </Card>
                                ) : null}

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
                                                                <Text
                                                                    variant="bodySmall"
                                                                    style={styles.wakeNotes}
                                                                >
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
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowWakeTimePicker(true)}
                                    style={styles.wakeTimeButton}
                                >
                                    {newWakeTime || "Select Time"}
                                </Button>

                                <TextInput
                                    label="Wake notes (optional)"
                                    value={newWakeNotes}
                                    onChangeText={setNewWakeNotes}
                                    style={styles.input}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={2}
                                />

                                <Button
                                    mode="contained"
                                    onPress={addWake}
                                    disabled={!newWakeTime}
                                    style={styles.addWakeButton}
                                >
                                    Add Wake
                                </Button>

                                {showWakeTimePicker && (
                                    <DateTimePicker
                                        value={
                                            newWakeTime
                                                ? parseDateTime(
                                                    editStartDate || nowParts.date,
                                                    newWakeTime,
                                                )
                                                : new Date()
                                        }
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
                            </View>
                        ) : null}
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
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
    card: {
        marginBottom: 16,
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
    actionsSection: {
        marginTop: 8,
        marginBottom: 8,
    },
    submitButton: {
        marginTop: 0,
    },
    statusCard: {
        backgroundColor: "#e3f2fd",
        marginBottom: 16,
    },
    wakeStatusCard: {
        backgroundColor: "#e3f2fd",
        marginBottom: 12,
    },
    deleteButton: {
        marginTop: 12,
        borderColor: "#d32f2f",
    },
    wakesSection: {
        marginTop: 8,
        paddingTop: 8,
    },
    sectionDivider: {
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        marginBottom: 16,
    },
    wakesTitle: {
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
    wakeTimeButton: {
        width: "100%",
        marginBottom: 12,
    },
    addWakeButton: {
        width: "100%",
    },
});
