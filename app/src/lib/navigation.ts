/**
 * The three destinations in the Figma glass sidebar.
 */
export type TabId = "talk" | "journal" | "beliefs";

export interface Tab {
  id: TabId;
  label: string;
  /** The route file this tab renders. */
  route: string;
}

/** Top to bottom, as the sidebar is laid out. */
export const TABS: Tab[] = [
  { id: "talk", label: "Talk", route: "talk" },
  { id: "journal", label: "Journal", route: "journal" },
  { id: "beliefs", label: "Beliefs", route: "beliefs" },
];
