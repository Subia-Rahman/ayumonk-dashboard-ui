import { Tabs, Tab, Box } from "@mui/material";

export default function DimensionTabs({ dimensions, activeDimensionId, onChange }) {
  if (!dimensions || dimensions.length === 0) {
    return null;
  }

  const value = dimensions.findIndex((d) => d.id === activeDimensionId);
  const safeValue = value >= 0 ? value : 0;

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={safeValue}
        onChange={(_event, newIndex) => {
          const next = dimensions[newIndex];
          if (next && next.id !== activeDimensionId) {
            onChange(next.id);
          }
        }}
        role="tablist"
        aria-label="Wellness dimension selector"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 44 }}
      >
        {dimensions.map((d) => (
          <Tab
            key={d.id}
            label={d.dimension_label}
            role="tab"
            aria-selected={d.id === activeDimensionId}
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 44 }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
