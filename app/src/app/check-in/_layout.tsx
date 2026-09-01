import { useCallback, useMemo, useState } from "react";
import { Stack } from "expo-router";
import { CheckInContext, EMPTY_DRAFT, type CheckInDraft } from "../../lib/checkin";
import { tokens } from "../../theme";

/** The three steps share one draft; it resets when the group unmounts. */
export default function CheckInLayout() {
  const [draft, setDraft] = useState<CheckInDraft>(EMPTY_DRAFT);
  const update = useCallback((patch: Partial<CheckInDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);
  const reset = useCallback(() => setDraft(EMPTY_DRAFT), []);
  const store = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);

  return (
    <CheckInContext.Provider value={store}>
      <Stack
        screenOptions={{
          headerShown: false,
          // Forward moves left, back moves right — travel direction, as on the web.
          animation: "slide_from_right",
          contentStyle: { backgroundColor: tokens.color.semantic.bg.primary },
        }}
      />
    </CheckInContext.Provider>
  );
}
