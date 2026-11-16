function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

export function interpolateStops(stops: string[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  if (stops.length === 0) {
    return '#000000';
  }
  if (stops.length === 1) {
    return stops[0];
  }
  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const a = hexToRgb(stops[index]);
  const b = hexToRgb(stops[index + 1]);
  const channels = a.map((value, channel) =>
    Math.round(value + (b[channel] - value) * fraction)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`;
}

export function heatColors(stops: string[], count: number): string[] {
  return Array.from({length: count}, (_, index) => interpolateStops(stops, index / Math.max(1, count - 1)));
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
