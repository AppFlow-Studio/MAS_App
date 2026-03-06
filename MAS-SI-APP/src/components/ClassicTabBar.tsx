import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import TabArray from '@/src/lib/tabs';

const SF_TO_MATERIAL: Record<string, string> = {
    'house.fill': 'home',
    'book': 'book-outline',
    'clock': 'clock-outline',
    'ellipsis.bubble.fill': 'chat-processing-outline',
};

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
};

const ACTIVE_COLOR = '#0D509D';
const INACTIVE_COLOR = '#8E8E93';

const ClassicTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();

    const iconScale0 = useSharedValue(1);
    const iconScale1 = useSharedValue(1);
    const iconScale2 = useSharedValue(1);
    const iconScale3 = useSharedValue(1);
    const iconScales = [iconScale0, iconScale1, iconScale2, iconScale3];

    useEffect(() => {
        const visibleRoutes = state.routes.filter(route =>
            TabArray.some(tab => tab.name === route.name)
        );
        visibleRoutes.forEach((route, index) => {
            const actualIndex = state.routes.findIndex(r => r.key === route.key);
            const isActive = state.index === actualIndex;
            if (iconScales[index]) {
                iconScales[index].value = withSpring(isActive ? 1.08 : 1, SPRING_CONFIG);
            }
        });
    }, [state.index]);

    const iconStyle0 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale0.value }] }));
    const iconStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale1.value }] }));
    const iconStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale2.value }] }));
    const iconStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale3.value }] }));
    const iconStyles = [iconStyle0, iconStyle1, iconStyle2, iconStyle3];

    const handlePress = (route: any, visibleIndex: number, onPress: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (iconScales[visibleIndex]) {
            iconScales[visibleIndex].value = 0.92;
            iconScales[visibleIndex].value = withSpring(1.08, SPRING_CONFIG);
        }
        onPress();
    };

    const totalHeight = 56 + Math.max(insets.bottom - 8, 4) + 12;

    return (
        <View style={{ height: totalHeight }}>
            <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom - 8, 4) }]}>
                <View style={styles.pill}>
                <BlurView
                    intensity={90}
                    tint="systemChromeMaterialLight"
                    style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
                />
                <View style={styles.pillOverlay} />
                <View style={styles.tabsContainer}>
                    {state.routes
                        .filter(route => TabArray.some(tab => tab.name === route.name))
                        .map((route, visibleIndex) => {
                            const { options } = descriptors[route.key];
                            const actualIndex = state.routes.findIndex(r => r.key === route.key);
                            const isFocused = state.index === actualIndex;
                            const tabItem = TabArray.find(tab => tab.name === route.name);

                            if (!tabItem) return null;

                            const iconStyle = iconStyles[visibleIndex] || iconStyles[0];
                            const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
                            const textColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            return (
                                <Pressable
                                    key={route.key}
                                    onPress={() => handlePress(route, visibleIndex, onPress)}
                                    style={styles.tab}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    {isFocused && <View style={styles.activeBackground} />}
                                    <Animated.View style={[styles.iconContainer, iconStyle]}>
                                        <Icon
                                            source={SF_TO_MATERIAL[tabItem?.icon || ''] || tabItem?.icon || 'circle'}
                                            size={22}
                                            color={iconColor}
                                        />
                                    </Animated.View>
                                    <Text
                                        style={[
                                            styles.label,
                                            {
                                                color: textColor,
                                                fontWeight: isFocused ? '600' : '400',
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {String(tabItem?.title || options.title || route.name || '')}
                                    </Text>
                                </Pressable>
                            );
                        })
                        .filter(Boolean)}
                </View>
            </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 12,
    },
    pill: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    pillOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 28,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 4,
        minHeight: 56,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        position: 'relative',
    },
    activeBackground: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 6,
        right: 6,
        backgroundColor: 'rgba(13, 80, 157, 0.08)',
        borderRadius: 16,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        textAlign: 'center',
    },
});

export default ClassicTabBar;
