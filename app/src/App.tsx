import { FontAwesome5 } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BabyTab from "./BabyTab";
import InsightsTab from "./InsightsTab";
import SleepTab from "./sleep/SleepTab";

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <PaperProvider>
                <NavigationContainer>
                    <Tab.Navigator
                        screenOptions={({ route }) => ({
                            headerTitle: "Sleeping Agent",
                            tabBarIconStyle: {
                                marginTop: 8,
                            },
                            tabBarLabelStyle: {
                                marginBottom: 6,
                            },
                            tabBarIcon: ({ color }) => {
                                const iconName =
                                    route.name === "Insights"
                                        ? "chart-line"
                                        : route.name === "Sleep"
                                            ? "moon"
                                            : "baby";

                                return <FontAwesome5 name={iconName} size={18} color={color} />;
                            },
                        })}
                    >
                        <Tab.Screen
                            name="Insights"
                            component={InsightsTab}
                            options={{ tabBarLabel: "Insights" }}
                        />
                        <Tab.Screen
                            name="Sleep"
                            component={SleepTab}
                            options={{ tabBarLabel: "Sleep" }}
                        />
                        <Tab.Screen
                            name="Baby"
                            component={BabyTab}
                            options={{ tabBarLabel: "Baby" }}
                        />
                    </Tab.Navigator>
                </NavigationContainer>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
