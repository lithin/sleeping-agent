import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import InsightsTab from "./InsightsTab";
import SleepTab from "./SleepTab";
import BabyTab from "./BabyTab";

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <PaperProvider>
                <NavigationContainer>
                    <Tab.Navigator
                        screenOptions={{
                            headerTitle: "Sleeping Agent",
                        }}
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
