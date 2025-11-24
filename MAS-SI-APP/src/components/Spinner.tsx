import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type SpinnerProps = {
  size?: number | 'small' | 'large';
  color?: string;
};

const Spinner = ({ size = 'large', color = '#FFFFFF' }: SpinnerProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Spinner;

