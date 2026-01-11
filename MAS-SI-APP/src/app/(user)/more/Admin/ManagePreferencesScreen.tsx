import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Icon } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";

// Types
interface ProgramTag {
  id: number;
  tag_key: string;
  tag_name: string;
  tag_type: string;
}

interface IslamicInterest {
  id: number;
  category_key: string;
  category_name: string;
  category_description: string | null;
  icon_name: string | null;
  parent_category_id: number | null;
  display_order: number;
}

interface IslamicGoal {
  id: number;
  goal_key: string;
  goal_name: string;
  goal_description: string | null;
  display_order: number;
}

type TabKey = "tags" | "interests" | "goals";

const TAG_TYPES = [
  { value: "audience", label: "Audience" },
  { value: "difficulty", label: "Difficulty" },
  { value: "format", label: "Format" },
  { value: "commitment", label: "Commitment" },
  { value: "topic", label: "Topic" },
];

const ManagePreferencesScreen = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("tags");
  const [loading, setLoading] = useState(true);

  // Data states
  const [programTags, setProgramTags] = useState<ProgramTag[]>([]);
  const [islamicInterests, setIslamicInterests] = useState<IslamicInterest[]>([]);
  const [islamicGoals, setIslamicGoals] = useState<IslamicGoal[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tagsRes, interestsRes, goalsRes] = await Promise.all([
        supabase.from("program_tags").select("*").order("tag_type").order("tag_name"),
        supabase.from("islamic_interest_categories").select("*").order("display_order"),
        supabase.from("islamic_goals").select("*").order("display_order"),
      ]);

      if (tagsRes.data) setProgramTags(tagsRes.data);
      if (interestsRes.data) setIslamicInterests(interestsRes.data);
      if (goalsRes.data) setIslamicGoals(goalsRes.data);
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Operations
  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === "tags") {
      setFormData({ tag_key: "", tag_name: "", tag_type: "audience" });
    } else if (activeTab === "interests") {
      setFormData({
        category_key: "",
        category_name: "",
        category_description: "",
        icon_name: "",
        parent_category_id: null,
        display_order: islamicInterests.length + 1,
      });
    } else {
      setFormData({
        goal_key: "",
        goal_name: "",
        goal_description: "",
        display_order: islamicGoals.length + 1,
      });
    }
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalVisible(true);
  };

  const handleDelete = (item: any) => {
    const tableName =
      activeTab === "tags"
        ? "program_tags"
        : activeTab === "interests"
        ? "islamic_interest_categories"
        : "islamic_goals";
    const itemName =
      activeTab === "tags"
        ? item.tag_name
        : activeTab === "interests"
        ? item.category_name
        : item.goal_name;

    Alert.alert("Delete", `Are you sure you want to delete "${itemName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from(tableName).delete().eq("id", item.id);
          if (error) {
            Alert.alert("Error", "Failed to delete item");
            console.log(error);
          } else {
            Toast.show({
              type: "success",
              text1: "Deleted successfully",
              position: "top",
              topOffset: 50,
            });
            fetchData();
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    const tableName =
      activeTab === "tags"
        ? "program_tags"
        : activeTab === "interests"
        ? "islamic_interest_categories"
        : "islamic_goals";

    // Validate required fields
    if (activeTab === "tags" && (!formData.tag_key || !formData.tag_name)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (activeTab === "interests" && (!formData.category_key || !formData.category_name)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (activeTab === "goals" && (!formData.goal_key || !formData.goal_name)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from(tableName)
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from(tableName).insert(formData);
        if (error) throw error;
      }

      Toast.show({
        type: "success",
        text1: editingItem ? "Updated successfully" : "Added successfully",
        position: "top",
        topOffset: 50,
      });
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save");
      console.log(error);
    }
  };

  // Render item card
  const renderTagItem = (item: ProgramTag) => (
    <View
      key={item.id}
      className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{item.tag_name}</Text>
        <View className="flex-row items-center mt-1">
          <View className="bg-blue-100 px-2 py-0.5 rounded-full mr-2">
            <Text className="text-xs text-blue-700">{item.tag_type}</Text>
          </View>
          <Text className="text-xs text-gray-400">key: {item.tag_key}</Text>
        </View>
      </View>
      <View className="flex-row">
        <Pressable onPress={() => handleEdit(item)} className="p-2 mr-1">
          <Icon source="pencil" size={20} color="#6077F5" />
        </Pressable>
        <Pressable onPress={() => handleDelete(item)} className="p-2">
          <Icon source="delete" size={20} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );

  const renderInterestItem = (item: IslamicInterest) => {
    const parent = item.parent_category_id
      ? islamicInterests.find((i) => i.id === item.parent_category_id)
      : null;
    return (
      <View
        key={item.id}
        className={`bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between ${
          item.parent_category_id ? "ml-4" : ""
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{item.category_name}</Text>
          {item.category_description && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {item.category_description}
            </Text>
          )}
          <View className="flex-row items-center mt-1">
            {parent && (
              <View className="bg-purple-100 px-2 py-0.5 rounded-full mr-2">
                <Text className="text-xs text-purple-700">under: {parent.category_name}</Text>
              </View>
            )}
            <Text className="text-xs text-gray-400">order: {item.display_order}</Text>
          </View>
        </View>
        <View className="flex-row">
          <Pressable onPress={() => handleEdit(item)} className="p-2 mr-1">
            <Icon source="pencil" size={20} color="#6077F5" />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} className="p-2">
            <Icon source="delete" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderGoalItem = (item: IslamicGoal) => (
    <View
      key={item.id}
      className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{item.goal_name}</Text>
        {item.goal_description && (
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
            {item.goal_description}
          </Text>
        )}
        <Text className="text-xs text-gray-400 mt-1">order: {item.display_order}</Text>
      </View>
      <View className="flex-row">
        <Pressable onPress={() => handleEdit(item)} className="p-2 mr-1">
          <Icon source="pencil" size={20} color="#6077F5" />
        </Pressable>
        <Pressable onPress={() => handleDelete(item)} className="p-2">
          <Icon source="delete" size={20} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );

  // Render form modal
  const renderFormModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            onPress={() => setModalVisible(false)}
          >
            <BlurView intensity={20} style={{ flex: 1 }} tint="dark" />
          </Pressable>

          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80%",
            }}
          >
            {/* Header */}
            <View className="px-6 pt-4 pb-3 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">
                  {editingItem ? "Edit" : "Add New"}{" "}
                  {activeTab === "tags"
                    ? "Tag"
                    : activeTab === "interests"
                    ? "Interest"
                    : "Goal"}
                </Text>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </Pressable>
              </View>
            </View>

            {/* Form */}
            <ScrollView className="px-6 py-4">
              {activeTab === "tags" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Tag Key *</Text>
                    <RNTextInput
                      value={formData.tag_key}
                      onChangeText={(text) =>
                        setFormData({ ...formData, tag_key: text.toLowerCase().replace(/\s/g, "_") })
                      }
                      placeholder="e.g., youth, beginner"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Tag Name *</Text>
                    <RNTextInput
                      value={formData.tag_name}
                      onChangeText={(text) => setFormData({ ...formData, tag_name: text })}
                      placeholder="e.g., Youth, Beginner"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Tag Type *</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {TAG_TYPES.map((type) => (
                        <Pressable
                          key={type.value}
                          onPress={() => setFormData({ ...formData, tag_type: type.value })}
                          className={`px-4 py-2 rounded-full ${
                            formData.tag_type === type.value
                              ? "bg-blue-500"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              formData.tag_type === type.value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {type.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {activeTab === "interests" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Category Key *</Text>
                    <RNTextInput
                      value={formData.category_key}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          category_key: text.toLowerCase().replace(/\s/g, "_"),
                        })
                      }
                      placeholder="e.g., quran_study, fiqh"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Category Name *
                    </Text>
                    <RNTextInput
                      value={formData.category_name}
                      onChangeText={(text) => setFormData({ ...formData, category_name: text })}
                      placeholder="e.g., Quran Study, Fiqh"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                    <RNTextInput
                      value={formData.category_description || ""}
                      onChangeText={(text) =>
                        setFormData({ ...formData, category_description: text })
                      }
                      placeholder="Optional description"
                      multiline
                      numberOfLines={3}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      style={{ minHeight: 80, textAlignVertical: "top" }}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Parent Category (optional)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Pressable
                        onPress={() => setFormData({ ...formData, parent_category_id: null })}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          !formData.parent_category_id ? "bg-blue-500" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            !formData.parent_category_id ? "text-white" : "text-gray-700"
                          }`}
                        >
                          None (Top Level)
                        </Text>
                      </Pressable>
                      {islamicInterests
                        .filter((i) => !i.parent_category_id && i.id !== editingItem?.id)
                        .map((interest) => (
                          <Pressable
                            key={interest.id}
                            onPress={() =>
                              setFormData({ ...formData, parent_category_id: interest.id })
                            }
                            className={`px-4 py-2 rounded-full mr-2 ${
                              formData.parent_category_id === interest.id
                                ? "bg-blue-500"
                                : "bg-gray-100"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                formData.parent_category_id === interest.id
                                  ? "text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {interest.category_name}
                            </Text>
                          </Pressable>
                        ))}
                    </ScrollView>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Display Order</Text>
                    <RNTextInput
                      value={String(formData.display_order || 0)}
                      onChangeText={(text) =>
                        setFormData({ ...formData, display_order: parseInt(text) || 0 })
                      }
                      keyboardType="numeric"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                </>
              )}

              {activeTab === "goals" && (
                <>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Goal Key *</Text>
                    <RNTextInput
                      value={formData.goal_key}
                      onChangeText={(text) =>
                        setFormData({ ...formData, goal_key: text.toLowerCase().replace(/\s/g, "_") })
                      }
                      placeholder="e.g., memorize_quran, learn_arabic"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Goal Name *</Text>
                    <RNTextInput
                      value={formData.goal_name}
                      onChangeText={(text) => setFormData({ ...formData, goal_name: text })}
                      placeholder="e.g., Memorize Quran, Learn Arabic"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                    <RNTextInput
                      value={formData.goal_description || ""}
                      onChangeText={(text) => setFormData({ ...formData, goal_description: text })}
                      placeholder="Optional description"
                      multiline
                      numberOfLines={3}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      style={{ minHeight: 80, textAlignVertical: "top" }}
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Display Order</Text>
                    <RNTextInput
                      value={String(formData.display_order || 0)}
                      onChangeText={(text) =>
                        setFormData({ ...formData, display_order: parseInt(text) || 0 })
                      }
                      keyboardType="numeric"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View className="px-6 py-4 border-t border-gray-100">
              <Pressable
                onPress={handleSave}
                className="bg-blue-600 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold text-base">
                  {editingItem ? "Save Changes" : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Group tags by type for display
  const groupedTags = programTags.reduce((acc, tag) => {
    if (!acc[tag.tag_type]) acc[tag.tag_type] = [];
    acc[tag.tag_type].push(tag);
    return acc;
  }, {} as Record<string, ProgramTag[]>);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manage Preferences",
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "600",
            color: "#1F2937",
          },
          headerTintColor: "#4A5568",
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 bg-gray-50">
        {/* Tabs */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row bg-gray-200 rounded-xl p-1">
            {[
              { key: "tags", label: "Tags", icon: "tag-multiple" },
              { key: "interests", label: "Interests", icon: "book-open-variant" },
              { key: "goals", label: "Goals", icon: "flag-checkered" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabKey)}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === tab.key ? "bg-white" : ""
                }`}
                style={
                  activeTab === tab.key
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }
                    : {}
                }
              >
                <Icon
                  source={tab.icon}
                  size={18}
                  color={activeTab === tab.key ? "#6077F5" : "#9CA3AF"}
                />
                <Text
                  className={`ml-2 font-medium ${
                    activeTab === tab.key ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6077F5" />
          </View>
        ) : (
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Tags Tab */}
            {activeTab === "tags" && (
              <>
                {Object.entries(groupedTags).map(([type, tags]) => (
                  <View key={type} className="mb-6">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                      {type} ({tags.length})
                    </Text>
                    {tags.map(renderTagItem)}
                  </View>
                ))}
                {programTags.length === 0 && (
                  <View className="py-12 items-center">
                    <Icon source="tag-off" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-4">No tags yet</Text>
                  </View>
                )}
              </>
            )}

            {/* Interests Tab */}
            {activeTab === "interests" && (
              <>
                {islamicInterests
                  .filter((i) => !i.parent_category_id)
                  .map((parent) => (
                    <View key={parent.id} className="mb-2">
                      {renderInterestItem(parent)}
                      {islamicInterests
                        .filter((child) => child.parent_category_id === parent.id)
                        .map(renderInterestItem)}
                    </View>
                  ))}
                {islamicInterests.length === 0 && (
                  <View className="py-12 items-center">
                    <Icon source="book-off" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-4">No interest categories yet</Text>
                  </View>
                )}
              </>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <>
                {islamicGoals.map(renderGoalItem)}
                {islamicGoals.length === 0 && (
                  <View className="py-12 items-center">
                    <Icon source="flag-off" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-4">No goals yet</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <Pressable
          onPress={handleAdd}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Icon source="plus" size={28} color="white" />
        </Pressable>

        {renderFormModal()}
      </View>
    </>
  );
};

export default ManagePreferencesScreen;

