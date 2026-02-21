import {
  Box,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import BabyTab from "./BabyTab";
import InsightsTab from "./InsightsTab";
import SleepTab from "./SleepTab";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Sleeping Agent
          </Typography>
          <Typography color="text.secondary">
            Track baby sleep, get AI suggestions.
          </Typography>
        </Box>

        <Paper variant="outlined">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Insights" />
            <Tab label="Sleep" />
            <Tab label="Baby" />
          </Tabs>

          {activeTab === 0 && (
            <InsightsTab />
          )}

          {activeTab === 1 && (
            <SleepTab />
          )}

          {activeTab === 2 && (
            <BabyTab />
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
