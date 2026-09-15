import { Redirect } from "expo-router";

/** The signed-in app opens directly into the conversation. */
export default function Index() {
  return <Redirect href="/talk" />;
}
