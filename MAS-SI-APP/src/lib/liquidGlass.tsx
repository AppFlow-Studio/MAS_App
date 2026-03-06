import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

type LiquidGlassViewProps = ViewProps & {
  interactive?: boolean;
  effect?: 'clear' | 'regular' | 'strong';
  children?: React.ReactNode;
};

const isIOS26 = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

let LiquidGlassViewComponent: React.ComponentType<LiquidGlassViewProps> | null = null;

if (isIOS26) {
  try {
    const liquidGlass = require('@callstack/liquid-glass');
    LiquidGlassViewComponent = liquidGlass.LiquidGlassView;
  } catch (error) {
    console.warn('@callstack/liquid-glass not available, using fallback');
  }
}

const BLUR_INTENSITY_MAP: Record<string, number> = {
  clear: 30,
  regular: 50,
  strong: 70,
};

const FallbackView: React.FC<LiquidGlassViewProps> = ({ children, style, effect = 'regular', ...props }) => (
  <View style={[style, { overflow: 'hidden', backgroundColor: 'rgba(200,200,200,0.5)' }]} {...props}>
    <BlurView
      intensity={BLUR_INTENSITY_MAP[effect] ?? 50}
      tint="light"
      style={StyleSheet.absoluteFill}
    />
    {children}
  </View>
);

export const LiquidGlassView: React.FC<LiquidGlassViewProps> = (LiquidGlassViewComponent ?? FallbackView) as React.FC<LiquidGlassViewProps>;
export const isLiquidGlassSupported = true;
