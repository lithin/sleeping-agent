import { zodResolver } from "@hookform/resolvers/zod";
import {
    Alert,
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { getNowParts, toDateInput, toIso } from "./helpers";
import { useApi } from "./useApi";
import { type Baby, type BabyFormValues, babySchema } from "./types";

const genderOptions = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
    { value: "unspecified", label: "Prefer not to say" },
];

const feedingOptions = [
    { value: "breastfed", label: "Breastfed" },
    { value: "bottlefed", label: "Bottle-fed" },
    { value: "mixed", label: "Mixed" },
];

export default function BabyTab() {
    const api = useApi();
    const [status, setStatus] = useState("");
    const [baby, setBaby] = useState<Baby | null>(null);
    const nowParts = useMemo(() => getNowParts(), []);

    const form = useForm<BabyFormValues>({
        resolver: zodResolver(babySchema),
        defaultValues: {
            name: "",
            date_of_birth: "",
            gender: "",
            feeding: "",
        },
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.get<Baby | null>("/baby");
                if (data) {
                    setBaby(data);
                    form.reset({
                        name: data.name ?? "",
                        date_of_birth: data.dateOfBirth ? toDateInput(data.dateOfBirth) : "",
                        gender: data.gender ?? "",
                        feeding: data.feeding ?? "",
                    });
                } else {
                    form.reset({
                        name: "",
                        date_of_birth: "",
                        gender: "",
                        feeding: "",
                    });
                }
            } catch (error) {
                setStatus(`Error loading baby profile: ${(error as Error).message}`);
            }
        };

        void load();
    }, [api, form]);

    const submit = form.handleSubmit(async (values) => {
        setStatus("");
        try {
            const payload = {
                name: values.name?.trim() || undefined,
                date_of_birth: values.date_of_birth
                    ? toIso(`${values.date_of_birth}T${nowParts.time}`)
                    : undefined,
                gender: values.gender || undefined,
                feeding: values.feeding || undefined,
            };
            const saved = await api.put<Baby>("/baby", payload);
            setBaby(saved);
            setStatus("Baby profile saved.");
        } catch (error) {
            setStatus(`Save baby error: ${(error as Error).message}`);
        }
    });

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Baby profile
            </Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Box component="form" onSubmit={submit}>
                    <Stack spacing={2}>
                        <TextField label="Name" {...form.register("name")} />
                        <TextField
                            label="Date of birth"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            {...form.register("date_of_birth")}
                        />
                        <FormControl fullWidth>
                            <InputLabel id="baby-gender-label">Gender</InputLabel>
                            <Select
                                labelId="baby-gender-label"
                                label="Gender"
                                value={form.watch("gender") ?? ""}
                                onChange={(event) => form.setValue("gender", event.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Not specified</em>
                                </MenuItem>
                                {genderOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="baby-feeding-label">Feeding</InputLabel>
                            <Select
                                labelId="baby-feeding-label"
                                label="Feeding"
                                value={form.watch("feeding") ?? ""}
                                onChange={(event) => form.setValue("feeding", event.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Not specified</em>
                                </MenuItem>
                                {feedingOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button type="submit" variant="contained">
                            Save profile
                        </Button>
                    </Stack>
                </Box>
            </Paper>
            {status ? (
                <Alert severity="info" sx={{ mt: 3 }}>
                    {status}
                </Alert>
            ) : null}
        </Box>
    );
}
