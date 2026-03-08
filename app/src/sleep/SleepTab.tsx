import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { usePullToRefresh } from "../usePullToRefresh";
import { SleepAddForm } from "./SleepAddForm";
import { SleepHistoryList } from "./SleepHistoryList";

export default function SleepTab() {
    const { refreshing, refreshToken, beginRefresh, settleRefresh } =
        usePullToRefresh(1);

    // Main list view
    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={beginRefresh} />
            }
        >
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.title}>
                    Track Sleep
                </Text>

                <SleepAddForm onSaved={beginRefresh} />

                <SleepHistoryList
                    refreshToken={refreshToken}
                    onRefreshSettled={settleRefresh}
                />
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
});
