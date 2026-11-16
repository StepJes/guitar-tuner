import React from 'react';
import Svg, {Circle, Line, Path, Polyline, Rect} from 'react-native-svg';
import {colors} from '../constants/theme';

export type IconName =
  | 'gear'
  | 'grid'
  | 'back'
  | 'chevron'
  | 'check'
  | 'close'
  | 'trash'
  | 'edit'
  | 'plus'
  | 'mail'
  | 'retry'
  | 'warning'
  | 'mic'
  | 'wave'
  | 'info'
  | 'reset'
  | 'play'
  | 'list'
  | 'flat'
  | 'sharp';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({name, size = 20, color = colors.text, strokeWidth = 1.8}: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'gear' && (
        <>
          <Circle cx="12" cy="12" r="3.2" {...common} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 8.98 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.98 4.6 1.7 1.7 0 0 0 10 3.04V3h4v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 20.96 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"
            {...common}
          />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1" {...common} />
          <Rect x="14" y="3" width="7" height="7" rx="1" {...common} />
          <Rect x="3" y="14" width="7" height="7" rx="1" {...common} />
          <Rect x="14" y="14" width="7" height="7" rx="1" {...common} />
        </>
      )}
      {name === 'back' && <Polyline points="15 4 7 12 15 20" {...common} />}
      {name === 'chevron' && <Polyline points="9 5 16 12 9 19" {...common} />}
      {name === 'check' && <Polyline points="4 12.5 9 17.5 20 6.5" {...common} />}
      {name === 'close' && (
        <>
          <Line x1="5" y1="5" x2="19" y2="19" {...common} />
          <Line x1="19" y1="5" x2="5" y2="19" {...common} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Polyline points="3 6 21 6" {...common} />
          <Path d="M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" {...common} />
        </>
      )}
      {name === 'edit' && <Path d="M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4" {...common} />}
      {name === 'plus' && (
        <>
          <Line x1="12" y1="4" x2="12" y2="20" {...common} />
          <Line x1="4" y1="12" x2="20" y2="12" {...common} />
        </>
      )}
      {name === 'mail' && (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2" {...common} />
          <Polyline points="3.5 7 12 13 20.5 7" {...common} />
        </>
      )}
      {name === 'retry' && (
        <>
          <Path d="M20 11a8 8 0 1 0-2.34 6.1" {...common} />
          <Polyline points="20 4 20 11 13 11" {...common} />
        </>
      )}
      {name === 'warning' && (
        <>
          <Path d="M12 3 22 20H2L12 3Z" {...common} />
          <Line x1="12" y1="9" x2="12" y2="14" {...common} />
          <Circle cx="12" cy="17" r="0.9" fill={color} stroke="none" />
        </>
      )}
      {name === 'mic' && (
        <>
          <Rect x="9" y="3" width="6" height="11" rx="3" {...common} />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" {...common} />
        </>
      )}
      {name === 'wave' && (
        <>
          <Path d="M2 12h3l2-6 3 12 3-16 3 20 2-10h4" {...common} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Line x1="12" y1="11" x2="12" y2="17" {...common} />
          <Circle cx="12" cy="7.5" r="0.9" fill={color} stroke="none" />
        </>
      )}
      {name === 'reset' && (
        <>
          <Path d="M4 11a8 8 0 1 1 2.34 6.1" {...common} />
          <Polyline points="4 4 4 11 11 11" {...common} />
        </>
      )}
      {name === 'play' && <Path d="M7 4l13 8-13 8V4Z" {...common} />}
      {name === 'list' && (
        <>
          <Line x1="8" y1="6" x2="21" y2="6" {...common} />
          <Line x1="8" y1="12" x2="21" y2="12" {...common} />
          <Line x1="8" y1="18" x2="21" y2="18" {...common} />
          <Circle cx="4" cy="6" r="1" fill={color} stroke="none" />
          <Circle cx="4" cy="12" r="1" fill={color} stroke="none" />
          <Circle cx="4" cy="18" r="1" fill={color} stroke="none" />
        </>
      )}
      {name === 'flat' && (
        <>
          <Path d="M9 4v13c4-2 6-3 6-6 0-2-2-3-5-2" {...common} />
          <Line x1="9" y1="4" x2="9" y2="20" {...common} />
        </>
      )}
      {name === 'sharp' && (
        <>
          <Line x1="9" y1="4" x2="7" y2="20" {...common} />
          <Line x1="17" y1="4" x2="15" y2="20" {...common} />
          <Line x1="5" y1="9" x2="19" y2="9" {...common} />
          <Line x1="4" y1="15" x2="18" y2="15" {...common} />
        </>
      )}
    </Svg>
  );
}
