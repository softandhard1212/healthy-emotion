import { Tabs } from "expo-router";
import { TABS } from "../../lib/navigation";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="talk" screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.id} name={tab.route} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
