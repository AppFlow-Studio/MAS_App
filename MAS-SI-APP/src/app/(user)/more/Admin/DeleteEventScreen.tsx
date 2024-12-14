import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { useAnimatedStyle, useSharedValue, withTiming }  from 'react-native-reanimated'
import { Program } from '@/src/types'

const DeleteEventScreen = () => {
  return (
    <View>
      <Text>DeleteEventScreen</Text>
    </View>
  )
}

export default DeleteEventScreen