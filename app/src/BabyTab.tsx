import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput, Menu } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    const [genderMenuVisible, setGenderMenuVisible] = useState(false);
    const [feedingMenuVisible, setFeedingMenuVisible] = useState(false);
    const nowParts = useMemo(() => getNowParts(), []);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
    } = useForm<BabyFormValues>({
        resolver: zodResolver(babySchema),
        defaultValues: {
            name: "",
            date_of_birth: "",
            gender: "",
            feeding: "",
        },
    });

    const genderValue = watch("gender") ?? "";
    const feedingValue = watch("feeding") ?? "";

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.get<Baby | null>("/baby");
                if (data) {
                    setBaby(data);
                    reset({
                        name: data.name ?? "",
                        date_of_birth: data.dateOfBirth ? toDateInput(data.dateOfBirth) : "",
                        gender: data.gender ?? "",
                        feeding: data.feeding ?? "",
                    });
                } else {
                    reset({
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
    }, [api, reset]);

    const submit = handleSubmit(async (values) => {
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

    const getGenderLabel = (value: string) => {
        const option = genderOptions.find((opt) => opt.value === value);
        return option?.label || "Not specified";
    };

    const getFeedingLabel = (value: string) => {
        const option = feedingOptions.find((opt) => opt.value === value);
        return option?.label || "Not specified";
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.title}>
                    Baby profile
                </Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Name"
                                    value={value}
                                    onChangeText={onChange}
                                    style={styles.input}
                                    mode="outlined"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="date_of_birth"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Date of birth (YYYY-MM-DD)"
                                    value={value}
                                    onChangeText={onChange}
                                    style={styles.input}
                                    mode="outlined"
                                    placeholder="YYYY-MM-DD"
                                />
                            )}
                        />

                        <View style={styles.menuContainer}>
                            <Menu
                                visible={genderMenuVisible}
                                onDismiss={() => setGenderMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setGenderMenuVisible(true)}
                                        style={styles.menuButton}
                                        contentStyle={styles.menuButtonContent}
                                    >
                                        Gender: {getGenderLabel(genderValue)}
                                    </Button>
                                }
                            >
                                <Menu.Item
                                    onPress={() => {
                                        setValue("gender", "");
                                        setGenderMenuVisible(false);
                                    }}
                                    title="Not specified"
                                />
                                {genderOptions.map((option) => (
                                    <Menu.Item
                                        key={option.value}
                                        onPress={() => {
                                            setValue("gender", option.value);
                                            setGenderMenuVisible(false);
                                        }}
                                        title={option.label}
                                    />
                                ))}
                            </Menu>
                        </View>

                        <View style={styles.menuContainer}>
                            <Menu
                                visible={feedingMenuVisible}
                                onDismiss={() => setFeedingMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setFeedingMenuVisible(true)}
                                        style={styles.menuButton}
                                        contentStyle={styles.menuButtonContent}
                                    >
                                        Feeding: {getFeedingLabel(feedingValue)}
                                    </Button>
                                }
                            >
                                <Menu.Item
                                    onPress={() => {
                                        setValue("feeding", "");
                                        setFeedingMenuVisible(false);
                                    }}
                                    title="Not specified"
                                />
                                {feedingOptions.map((option) => (
                                    <Menu.Item
                                        key={option.value}
                                        onPress={() => {
                                            setValue("feeding", option.value);
                                            setFeedingMenuVisible(false);
                                        }}
                                        title={option.label}
                                    />
                                ))}
                            </Menu>
                        </View>

                        <Button mode="contained" onPress={submit} style={styles.submitButton}>
                            Save profile
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
    input: {
        marginBottom: 12,
    },
    menuContainer: {
        marginBottom: 12,
    },
    menuButton: {
        width: "100%",
    },
    menuButtonContent: {
        justifyContent: "flex-start",
    },
    submitButton: {
        marginTop: 8,
    },
    statusCard: {
        backgroundColor: "#e3f2fd",
    },
});
