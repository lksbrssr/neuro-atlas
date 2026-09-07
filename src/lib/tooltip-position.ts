/** Keep a centered `fixed` tooltip (`translateX(-50%)`) inside the viewport. */
export function clampCenteredTooltipX(
  anchorCenterX: number,
  tooltipWidthPx: number,
  viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth,
  pad = 12,
) {
  const half = tooltipWidthPx / 2;
  const min = half + pad;
  const max = Math.max(min, viewportWidth - half - pad);
  return Math.min(Math.max(anchorCenterX, min), max);
}
