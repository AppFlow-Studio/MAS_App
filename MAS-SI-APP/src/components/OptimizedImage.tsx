import React, { useState, memo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageContentFit, ImageSource, ImageStyle } from 'expo-image';
import { FlyerSkeleton } from './FlyerSkeleton';

type OptimizedImageProps = {
  source: ImageSource | string | null | undefined;
  fallbackSource?: ImageSource;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  width?: number;
  height?: number;
  showSkeleton?: boolean;
  skeletonStyle?: StyleProp<ViewStyle>;
  transition?: number;
  onLoad?: () => void;
  onError?: () => void;
};

/**
 * OptimizedImage - A wrapper around expo-image with built-in caching,
 * loading skeleton, and error fallback handling.
 *
 * Features:
 * - Memory-disk caching policy for optimal performance
 * - Built-in loading skeleton animation
 * - Error fallback to specified or default image
 * - Smooth transition animations
 */
const OptimizedImage = memo(({
  source,
  fallbackSource,
  style,
  containerStyle,
  contentFit = 'cover',
  width,
  height,
  showSkeleton = true,
  skeletonStyle,
  transition = 200,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine the actual source to use
  const getSource = (): ImageSource | undefined => {
    if (hasError && fallbackSource) {
      return fallbackSource;
    }

    if (!source) {
      return fallbackSource;
    }

    if (typeof source === 'string') {
      if (!source.trim()) {
        return fallbackSource;
      }
      return { uri: source };
    }

    return source;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const actualSource = getSource();

  // Calculate dimensions for skeleton
  const skeletonWidth = width || (typeof style === 'object' && style && 'width' in style ? Number(style.width) : 100);
  const skeletonHeight = height || (typeof style === 'object' && style && 'height' in style ? Number(style.height) : 100);

  return (
    <View style={[containerStyle, { position: 'relative' }]}>
      {/* Loading skeleton */}
      {showSkeleton && isLoading && (
        <FlyerSkeleton
          width={skeletonWidth}
          height={skeletonHeight}
          style={[styles.skeleton, skeletonStyle]}
        />
      )}

      {/* Actual image */}
      <Image
        source={actualSource}
        style={style}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={transition}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
});

export default OptimizedImage;
