import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

dayjs.extend(advancedFormat);

import {
    getNowParts,
    toDateInput,
    toIso,
    toTimeInput,
} from "./helpers";
import { useApi } from "./useApi";
import {
    type Sleep,
    type SleepFormValues,
    type SleepWake,
    type WakeFormValues,
    sleepSchema,
    wakeSchema,
} from "./types";

type SleepDraft = {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    type: SleepFormValues["type"];
    notes: string;
};

export default function SleepTab() {
    const [sleeps, setSleeps] = useState<Sleep[]>([]);
    const [selectedSleep, setSelectedSleep] = useState<Sleep | null>(null);
    const [status, setStatus] = useState("");
    const [editingSleepId, setEditingSleepId] = useState<number | null>(null);
    const [sleepDraft, setSleepDraft] = useState<SleepDraft | null>(null);
    const api = useApi();
    const nowParts = useMemo(() => getNowParts(), []);

    useEffect(() => {
        if (selectedSleep) {
            setSleepDraft({
                startDate: toDateInput(selectedSleep.startTime),
                startTime: toTimeInput(selectedSleep.startTime),
                endDate: selectedSleep.endTime ? toDateInput(selectedSleep.endTime) : "",
                endTime: selectedSleep.endTime ? toTimeInput(selectedSleep.endTime) : "",
                type: selectedSleep.type,
                notes: selectedSleep.notes ?? "",
            });
        } else {
            setSleepDraft(null);
        }
    }, [selectedSleep]);

    const sleepForm = useForm<SleepFormValues>({
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

    const wakeForm = useForm<WakeFormValues>({
        resolver: zodResolver(wakeSchema),
        defaultValues: { wakes: {} },
    });

    useEffect(() => {
        const load = async () => {
            try {
                const sleepData = await api.get<Sleep[]>("/sleeps");
                setSleeps(sleepData);
            } catch (error) {
                setStatus(`Error loading sleeps: ${(error as Error).message}`);
            }
        };

        void load();
    }, [api]);

    const submitSleep = sleepForm.handleSubmit(async (values) => {
        setStatus("");
        if (
            (values.end_date && !values.end_time) ||
            (!values.end_date && values.end_time)
        ) {
            if (!values.end_date) {
                sleepForm.setError("end_date", {
                    type: "manual",
                    message: "End date is required when end time is set",
                });
            }
            if (!values.end_time) {
                sleepForm.setError("end_time", {
                    type: "manual",
                    message: "End time is required when end date is set",
                });
            }
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
            sleepForm.reset({
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

    const submitWake = (sleepId: number) =>
        wakeForm.handleSubmit(async (values) => {
            setStatus("");
            const wake = values.wakes?.[sleepId];
            if (!wake?.time) {
                wakeForm.setError(`wakes.${sleepId}.time`, {
                    type: "manual",
                    message: "Wake time is required",
                });
                return;
            }
            try {
                // Find the sleep to get start and end times
                const sleep = sleeps.find(s => s.id === sleepId);
                if (!sleep) {
                    setStatus("Sleep not found");
                    return;
                }

                // Extract time components
                const [wakeHour] = wake.time.split(':').map(Number);
                const startTime = new Date(sleep.startTime);
                const endTime = sleep.endTime ? new Date(sleep.endTime) : null;

                // Determine the date for the wake
                let wakeDate: string;
                if (endTime) {
                    const startHour = startTime.getHours();
                    // If wake time >= start time (in 24h), use start date
                    // Otherwise use end date
                    if (wakeHour >= startHour) {
                        wakeDate = toDateInput(sleep.startTime);
                    } else {
                        wakeDate = toDateInput(sleep.endTime!);
                    }
                } else {
                    // If no end time, use start date
                    wakeDate = toDateInput(sleep.startTime);
                }

                const payload = {
                    sleep_id: sleepId,
                    timestamp: toIso(`${wakeDate}T${wake.time}`),
                    notes: wake.notes?.trim() || undefined,
                };
                const created = await api.post<SleepWake>("/sleep-wakes", payload);
                setSleeps((current) =>
                    current.map((sleep) =>
                        sleep.id === sleepId
                            ? { ...sleep, wakes: [created, ...sleep.wakes] }
                            : sleep,
                    ),
                );
                const resetNow = getNowParts();
                wakeForm.setValue(`wakes.${sleepId}.time`, resetNow.time);
                wakeForm.setValue(`wakes.${sleepId}.notes`, "");
                setStatus("Wake saved.");

                // Update selectedSleep if it's the current sleep
                if (selectedSleep?.id === sleepId) {
                    setSelectedSleep(prev => prev ? { ...prev, wakes: [created, ...prev.wakes] } : null);
                }
            } catch (error) {
                setStatus(`Wake error: ${(error as Error).message}`);
            }
        });

    const removeSleep = async (id: number) => {
        setStatus("");
        try {
            await api.delete(`/sleeps/${id}`);
            setSleeps((current) => current.filter((sleep) => sleep.id !== id));
            setStatus("Sleep removed.");
        } catch (error) {
            setStatus(`Remove sleep error: ${(error as Error).message}`);
        }
    };

    const removeWake = async (sleepId: number, wakeId: number) => {
        setStatus("");
        try {
            await api.delete(`/sleep-wakes/${wakeId}`);
            setSleeps((current) =>
                current.map((sleep) =>
                    sleep.id === sleepId
                        ? {
                            ...sleep,
                            wakes: sleep.wakes.filter((wake) => wake.id !== wakeId),
                        }
                        : sleep,
                ),
            );
            setStatus("Wake removed.");
        } catch (error) {
            setStatus(`Remove wake error: ${(error as Error).message}`);
        }
    };

    const startEditSleep = (sleep: Sleep) => {
        setEditingSleepId(sleep.id);
        setSleepDraft({
            startDate: toDateInput(sleep.startTime),
            startTime: toTimeInput(sleep.startTime),
            endDate: sleep.endTime ? toDateInput(sleep.endTime) : "",
            endTime: sleep.endTime ? toTimeInput(sleep.endTime) : "",
            type: sleep.type,
            notes: sleep.notes ?? "",
        });
    };

    const cancelEditSleep = () => {
        setEditingSleepId(null);
        setSleepDraft(null);
    };

    const saveEditSleep = async (sleep: Sleep) => {
        if (!sleepDraft) return;
        if (!sleepDraft.startDate || !sleepDraft.startTime) {
            setStatus("Start date and time are required.");
            return;
        }
        if (
            (sleepDraft.endDate && !sleepDraft.endTime) ||
            (!sleepDraft.endDate && sleepDraft.endTime)
        ) {
            setStatus("End date and time must both be set.");
            return;
        }
        setStatus("");
        try {
            const payload = {
                start_time: toIso(`${sleepDraft.startDate}T${sleepDraft.startTime}`),
                end_time:
                    sleepDraft.endDate && sleepDraft.endTime
                        ? toIso(`${sleepDraft.endDate}T${sleepDraft.endTime}`)
                        : undefined,
                type: sleepDraft.type,
                notes: sleepDraft.notes?.trim() || undefined,
            };
            const updated = await api.put<Sleep>(`/sleeps/${sleep.id}`, payload);
            setSleeps((current) =>
                current.map((item) =>
                    item.id === sleep.id
                        ? {
                            ...item,
                            ...updated,
                            wakes: item.wakes,
                        }
                        : item,
                ),
            );
            setStatus("Sleep updated.");
            cancelEditSleep();
        } catch (error) {
            setStatus(`Update sleep error: ${(error as Error).message}`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Log a sleep
            </Typography>
            <Box component="form" onSubmit={submitSleep}>
                <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Controller
                            name="start_time"
                            control={sleepForm.control}
                            render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        label="Start time"
                                        value={field.value ? dayjs(`2000-01-01T${field.value}`) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                field.onChange(newValue.format("HH:mm"));
                                            } else {
                                                field.onChange("");
                                            }
                                        }}
                                        ampm={false}
                                        slotProps={{
                                            textField: {
                                                error: Boolean(sleepForm.formState.errors.start_time),
                                                helperText: sleepForm.formState.errors.start_time?.message,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        />
                        <Controller
                            name="start_date"
                            control={sleepForm.control}
                            render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Start date"
                                        value={field.value ? dayjs(field.value) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                field.onChange(newValue.format("YYYY-MM-DD"));
                                            } else {
                                                field.onChange("");
                                            }
                                        }}
                                        format="ddd Do"
                                        slotProps={{
                                            textField: {
                                                error: Boolean(sleepForm.formState.errors.start_date),
                                                helperText: sleepForm.formState.errors.start_date?.message,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Controller
                            name="end_time"
                            control={sleepForm.control}
                            render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        label="End time"
                                        value={field.value ? dayjs(`2000-01-01T${field.value}`) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                field.onChange(newValue.format("HH:mm"));
                                            } else {
                                                field.onChange("");
                                            }
                                        }}
                                        ampm={false}
                                        slotProps={{
                                            textField: {
                                                error: Boolean(sleepForm.formState.errors.end_time),
                                                helperText: sleepForm.formState.errors.end_time?.message,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        />
                        <Controller
                            name="end_date"
                            control={sleepForm.control}
                            render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="End date"
                                        value={field.value ? dayjs(field.value) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                field.onChange(newValue.format("YYYY-MM-DD"));
                                            } else {
                                                field.onChange("");
                                            }
                                        }}
                                        format="ddd Do"
                                        slotProps={{
                                            textField: {
                                                error: Boolean(sleepForm.formState.errors.end_date),
                                                helperText: sleepForm.formState.errors.end_date?.message,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        />
                    </Stack>
                    <Controller
                        name="type"
                        control={sleepForm.control}
                        render={({ field }) => (
                            <ToggleButtonGroup
                                value={field.value}
                                exclusive
                                onChange={(_, value) => value && field.onChange(value)}
                                size="small"
                            >
                                <ToggleButton value="nap">Nap</ToggleButton>
                                <ToggleButton value="night">Night</ToggleButton>
                            </ToggleButtonGroup>
                        )}
                    />
                    <TextField
                        label="Notes"
                        {...sleepForm.register("notes")}
                    />
                    <Button type="submit" variant="contained">
                        Save sleep
                    </Button>
                </Stack>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Recent sleeps
            </Typography>
            {sleeps.length === 0 ? (
                <Typography color="text.secondary">No sleeps logged yet.</Typography>
            ) : (
                <Stack spacing={3}>
                    {Object.entries(
                        sleeps.reduce((acc, sleep) => {
                            const startDate = toDateInput(sleep.startTime);
                            if (!acc[startDate]) acc[startDate] = [];
                            acc[startDate].push(sleep);
                            return acc;
                        }, {} as Record<string, Sleep[]>)
                    )
                        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                        .map(([date, daySleeps]) => {
                            const dateObj = new Date(date + 'T00:00:00');
                            const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(dateObj);
                            return (
                                <Box key={date}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        {dayLabel}
                                    </Typography>
                                    <Stack spacing={1}>
                                        {[...daySleeps]
                                            .sort((a, b) => {
                                                const aTime = a.endTime ? new Date(a.endTime).getTime() : new Date(a.startTime).getTime();
                                                const bTime = b.endTime ? new Date(b.endTime).getTime() : new Date(b.startTime).getTime();
                                                return bTime - aTime;
                                            })
                                            .map((sleep) => {
                                                const startTime = new Date(sleep.startTime);
                                                const endTime = sleep.endTime ? new Date(sleep.endTime) : null;
                                                const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                                                return (
                                                    <Paper
                                                        key={sleep.id}
                                                        variant="outlined"
                                                        sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                                        onClick={() => setSelectedSleep(sleep)}
                                                    >
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                                                    {sleep.type}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {formatTime(startTime)} → {endTime ? formatTime(endTime) : '—'}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={`${sleep.wakes.length} wake${sleep.wakes.length !== 1 ? 's' : ''}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Stack>
                                                    </Paper>
                                                );
                                            })}
                                    </Stack>
                                </Box>
                            );
                        })}
                </Stack>
            )}

            <Dialog
                open={selectedSleep !== null}
                onClose={() => setSelectedSleep(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedSleep && (
                    <>
                        <DialogTitle sx={{ textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedSleep.type}
                            <IconButton
                                aria-label="close"
                                onClick={() => setSelectedSleep(null)}
                                sx={{
                                    color: 'inherit',
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 1 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <Controller
                                        name="start_time"
                                        control={sleepForm.control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <TimePicker
                                                    label="Start time"
                                                    value={sleepDraft?.startTime ? dayjs(`2000-01-01T${sleepDraft.startTime}`) : null}
                                                    onChange={(newValue) => {
                                                        if (newValue) {
                                                            setSleepDraft((current) =>
                                                                current ? { ...current, startTime: newValue.format("HH:mm") } : current
                                                            );
                                                        }
                                                    }}
                                                    ampm={false}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />
                                    <Controller
                                        name="start_date"
                                        control={sleepForm.control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Start date"
                                                    value={sleepDraft?.startDate ? dayjs(sleepDraft.startDate) : null}
                                                    onChange={(newValue) => {
                                                        if (newValue) {
                                                            setSleepDraft((current) =>
                                                                current ? { ...current, startDate: newValue.format("YYYY-MM-DD") } : current
                                                            );
                                                        }
                                                    }}
                                                    format="ddd Do"
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />
                                </Stack>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <Controller
                                        name="end_time"
                                        control={sleepForm.control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <TimePicker
                                                    label="End time"
                                                    value={sleepDraft?.endTime ? dayjs(`2000-01-01T${sleepDraft.endTime}`) : null}
                                                    onChange={(newValue) => {
                                                        if (newValue) {
                                                            setSleepDraft((current) =>
                                                                current ? { ...current, endTime: newValue.format("HH:mm") } : current
                                                            );
                                                        }
                                                    }}
                                                    ampm={false}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />
                                    <Controller
                                        name="end_date"
                                        control={sleepForm.control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="End date"
                                                    value={sleepDraft?.endDate ? dayjs(sleepDraft.endDate) : null}
                                                    onChange={(newValue) => {
                                                        if (newValue) {
                                                            setSleepDraft((current) =>
                                                                current ? { ...current, endDate: newValue.format("YYYY-MM-DD") } : current
                                                            );
                                                        }
                                                    }}
                                                    format="ddd Do"
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />
                                </Stack>
                                <TextField
                                    label="Notes"
                                    value={sleepDraft?.notes ?? ""}
                                    onChange={(event) =>
                                        setSleepDraft((current) =>
                                            current ? { ...current, notes: event.target.value } : current
                                        )
                                    }
                                />
                                <Divider sx={{ my: 2 }} />
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Wakes
                                    </Typography>
                                    {selectedSleep.wakes.length > 0 && (
                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            {[...selectedSleep.wakes]
                                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                                .map((wake) => {
                                                    const wakeTime = new Date(wake.timestamp);
                                                    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                                                    return (
                                                        <Stack
                                                            key={wake.id}
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatTime(wakeTime)}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => removeWake(selectedSleep.id, wake.id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    );
                                                })}
                                        </Stack>
                                    )}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography>Add wake</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box component="form" onSubmit={submitWake(selectedSleep.id)}>
                                                <Stack spacing={2}>
                                                    <Controller
                                                        name={`wakes.${selectedSleep.id}.time` as any}
                                                        control={wakeForm.control}
                                                        render={({ field }) => (
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <TimePicker
                                                                    label="Wake time"
                                                                    value={field.value ? dayjs(`2000-01-01T${field.value}`) : dayjs(`2000-01-01T${nowParts.time}`)}
                                                                    onChange={(newValue) => {
                                                                        if (newValue) {
                                                                            field.onChange(newValue.format("HH:mm"));
                                                                        }
                                                                    }}
                                                                    ampm={false}
                                                                    slotProps={{
                                                                        textField: {
                                                                            size: "small",
                                                                            error: Boolean(wakeForm.formState.errors.wakes?.[selectedSleep.id]?.time),
                                                                            helperText: wakeForm.formState.errors.wakes?.[selectedSleep.id]?.time?.message ?? "",
                                                                        },
                                                                    }}
                                                                />
                                                            </LocalizationProvider>
                                                        )}
                                                    />
                                                    <TextField
                                                        label="Notes"
                                                        size="small"
                                                        {...wakeForm.register(`wakes.${selectedSleep.id}.notes`)}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                    >
                                                        Add wake
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
                            <Button
                                color="error"
                                onClick={() => {
                                    if (selectedSleep) {
                                        removeSleep(selectedSleep.id);
                                        setSelectedSleep(null);
                                    }
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (selectedSleep) {
                                        saveEditSleep(selectedSleep);
                                        setSelectedSleep(null);
                                    }
                                }}
                            >
                                Save
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {status ? (
                <Alert severity="info" sx={{ mt: 3 }}>
                    {status}
                </Alert>
            ) : null}
        </Box>
    );
}
