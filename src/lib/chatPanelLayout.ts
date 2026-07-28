export const CHAT_MIN_DEFAULT = 320;
export const PANEL_MIN_DEFAULT = 240;
export const PANEL_MAX_DEFAULT = 560;

export function clampPanelWidth(input: {
  containerWidth: number;
  sidebarWidth: number;
  panelWidth: number;
  chatMin?: number;
  panelMin?: number;
  panelMax?: number;
  gutter?: number;
}): { width: number; shouldCollapse: boolean } {
  const chatMin = input.chatMin ?? CHAT_MIN_DEFAULT;
  const panelMin = input.panelMin ?? PANEL_MIN_DEFAULT;
  const panelMax = input.panelMax ?? PANEL_MAX_DEFAULT;
  const gutter = input.gutter ?? 8;
  const maxPanel = Math.min(
    panelMax,
    input.containerWidth - input.sidebarWidth - chatMin - gutter,
  );
  if (maxPanel < panelMin) {
    return { width: panelMin, shouldCollapse: true };
  }
  const width = Math.min(maxPanel, Math.max(panelMin, input.panelWidth));
  return { width, shouldCollapse: false };
}
