export function contrastRatio(foreground: [number, number, number], background: [number, number, number]) {
  const luminance = (rgb: [number, number, number]) => {
    const channels = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export const COVER_NAVY: [number, number, number] = [30, 41, 59];
export const COVER_MINT: [number, number, number] = [16, 185, 129];
