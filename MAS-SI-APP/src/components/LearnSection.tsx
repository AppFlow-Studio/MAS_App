import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';

const LearnSection = ({ onNext, onBack, benefits }) => {
  return (
    <View className="px-4 py-6 bg-white rounded-lg shadow-md">
      {/* Section Title */}
      <Text className="text-xl font-bold text-center mb-4">Learn Section</Text>

      {/* Benefits List */}
      <View className="space-y-2">
        {benefits.map((benefit, index) => (
          <View key={index} className="flex-row items-center space-x-2">
            <Icon source="check-circle" size={20} color="green" />
            <Text className="text-md">{benefit}</Text>
          </View>
        ))}
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between mt-6">
        <TouchableOpacity onPress={onBack} className="px-4 py-2 bg-gray-300 rounded-lg">
          <Text className="text-black">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} className="px-4 py-2 bg-blue-500 rounded-lg">
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LearnSection;
