import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { TextInput } from 'react-native-paper'
import { Icon } from 'react-native-paper'
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    FadeIn,
    FadeOut
} from 'react-native-reanimated'

type ValidatedInputProps = {
    label: string
    placeholder: string
    value: string | undefined
    onChangeText: (text: string) => void
    onBlur: () => void
    error?: string
    keyboardType?: 'default' | 'email-address' | 'number-pad'
    isValid?: boolean
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

const ValidatedInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    onBlur,
    error,
    keyboardType = 'default',
    isValid = false,
    autoCapitalize = 'sentences'
}: ValidatedInputProps) => {
    const borderColorAnim = useSharedValue('#E5E7EB')
    const iconScale = useSharedValue(0)
    
    useEffect(() => {
        if (error) {
            borderColorAnim.value = withTiming('#EF4444', { duration: 200 })
            iconScale.value = withTiming(1, { duration: 150 })
        } else if (isValid) {
            borderColorAnim.value = withTiming('#22C55E', { duration: 200 })
            iconScale.value = withTiming(1, { duration: 150 })
        } else {
            borderColorAnim.value = withTiming('#E5E7EB', { duration: 200 })
            iconScale.value = withTiming(0, { duration: 150 })
        }
    }, [error, isValid])

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
        opacity: iconScale.value
    }))

    const getBorderColor = () => {
        if (error) return '#EF4444'
        if (isValid) return '#22C55E'
        return '#E5E7EB'
    }

    const getActiveBorderColor = () => {
        if (error) return '#EF4444'
        if (isValid) return '#22C55E'
        return '#111827'
    }

    return (
        <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 }}>
                    {label}
                </Text>
                
                {/* Validation Icon */}
                <Animated.View style={[iconAnimatedStyle, { marginLeft: 8 }]}>
                    {error ? (
                        <View style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: 10, 
                            backgroundColor: '#FEE2E2',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Icon source="close" size={14} color="#EF4444" />
                        </View>
                    ) : isValid ? (
                        <View style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: 10, 
                            backgroundColor: '#DCFCE7',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Icon source="check" size={14} color="#22C55E" />
                        </View>
                    ) : null}
                </Animated.View>
            </View>
            
            <TextInput
                mode='outlined'
                placeholder={placeholder}
                onBlur={onBlur}
                value={value}
                onChangeText={onChangeText}
                style={{ backgroundColor: '#FFFFFF' }}
                outlineColor={getBorderColor()}
                activeOutlineColor={getActiveBorderColor()}
                textColor='#111827'
                placeholderTextColor='#9CA3AF'
                outlineStyle={{ borderRadius: 12, borderWidth: 2 }}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
            
            {/* Error Message */}
            {error && (
                <Animated.View
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(100)}
                >
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 6,
                        paddingHorizontal: 4
                    }}>
                        <Icon source="alert-circle" size={14} color="#EF4444" />
                        <Text style={{
                            color: '#EF4444',
                            fontSize: 12,
                            marginLeft: 4,
                            fontWeight: '500'
                        }}>
                            {error}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    )
}

export default ValidatedInput
