import { StyleSheet, View, FlatList, Button, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Link, Stack } from "expo-router";
import ProgramsListProgram from "../../../../components/ProgramsListProgram"
import { Divider, Searchbar } from 'react-native-paper';
import { useState, useCallback, useMemo } from 'react';
import { Program } from "@/src/types"
import { useAuth } from '@/src/providers/AuthProvider';
import { useCurrentPrograms, usePastRecordedPrograms } from '@/src/hooks/usePrograms';

type ListRow =
  | { type: 'header'; title: string; key: string; isFirst: boolean }
  | { type: 'programRow'; programs: Program[]; key: string };

export default function ProgramsScreen() {
  const { session } = useAuth()
  const { data: shownData, isLoading: currentLoading, refetch: refetchCurrent } = useCurrentPrograms()
  const { data: prevRecordedPrograms, isLoading: pastLoading, refetch: refetchPast } = usePastRecordedPrograms()
  const [searchBarInput, setSearchBarInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const loading = currentLoading || pastLoading

  const onRefreshPrograms = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchCurrent(), refetchPast()])
    } finally {
      setRefreshing(false)
    }
  }
  const tabBarHeight = 20;
  const filterTestFunc = useCallback((searchParam: string) => {
    setSearchBarInput(searchParam)
  }, [])

  const seperator = useCallback(() => {
    return (
      <View style={{ alignItems: "center", marginVertical: 3 }}>
        <Divider style={{ height: 0.5, width: "50%", backgroundColor: 'lightgray' }} />
      </View>
    )
  }, [])

  // Helper to chunk an array into pairs for 2-column grid rows
  const chunkIntoPairs = (arr: Program[], prefix: string): ListRow[] => {
    const rows: ListRow[] = [];
    for (let i = 0; i < arr.length; i += 2) {
      rows.push({
        type: 'programRow',
        programs: arr.slice(i, i + 2),
        key: `${prefix}-row-${i}`,
      });
    }
    return rows;
  };

  // Build a flat list of rows: headers + program pair-rows
  const listData = useMemo(() => {
    const items: ListRow[] = [];

    items.push({ type: 'header', title: 'Current Programs', key: 'header-current', isFirst: true });
    if (shownData && shownData.length > 0) {
      items.push(...chunkIntoPairs(shownData, 'current'));
    }

    items.push({ type: 'header', title: 'Past Recorded Programs', key: 'header-past', isFirst: false });
    if (prevRecordedPrograms && prevRecordedPrograms.length > 0) {
      items.push(...chunkIntoPairs(prevRecordedPrograms, 'past'));
    }

    return items;
  }, [shownData, prevRecordedPrograms]);

  const renderProgramCard = useCallback((program: Program) => (
    <View key={program.program_id} style={{ width: '50%' }}>
      <Link href={`/menu/program/${program.program_id}`} asChild>
        <TouchableOpacity className='items-center'>
          <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
              <Image
                source={program.program_img ? { uri: program.program_img } : require('@/assets/images/MASHomeLogo.png')}
                style={{ width: 150, height: 150, borderRadius: 15 }}
                resizeMode="cover"
              />
            </View>
            <View>
              <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                <Text style={{ textAlign: "center" }} className='text-md' numberOfLines={1}>{program.program_name}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  ), []);

  const renderItem = useCallback(({ item }: { item: ListRow }) => {
    if (item.type === 'header') {
      return (
        <Text
          className='font-bold text-black text-lg ml-3'
          style={{ marginTop: item.isFirst ? 20 : 56, marginBottom: item.isFirst ? 32 : 25 }}
        >
          {item.title}
        </Text>
      );
    }

    return (
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {item.programs.map(renderProgramCard)}
      </View>
    );
  }, [renderProgramCard]);

  const keyExtractor = useCallback((item: ListRow) => item.key, []);

  return (
    <View className=' bg-[#0D509D] flex-1'>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefreshPrograms} />}
        style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: 'white' }}
        contentContainerStyle={{ paddingTop: 2, backgroundColor: 'white', paddingBottom: 50 }}
      />
    </View>
  )
}