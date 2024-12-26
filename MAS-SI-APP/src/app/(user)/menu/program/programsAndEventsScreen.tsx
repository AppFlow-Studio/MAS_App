import React, { useEffect, useRef, useState } from 'react'
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import ProgramsScreen from './allPrograms';
import Event from './events/Event';
import Pace from './pace/Pace';
import UpcomingEvents from './upcomingEvents/UpcomingEvents';
import { View, TouchableOpacity, StyleSheet, Text, SafeAreaView, StatusBar, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate, withSpring } from 'react-native-reanimated';
import { TabBar, TabBarIndicator, TabBarIndicatorProps, TabBarProps } from 'react-native-tab-view';
import { TabView, SceneMap } from 'react-native-tab-view';
import Kids from './kids/Kids';

const FirstRoute = () => (
  <UpcomingEvents />
);

const SecondRoute = () => (
  <Kids />
);

const ThirdRoute = () => (
  <ProgramsScreen />
)
const FourthRoute = () => (
  <Event />
)
const FifthRoute =() => (
  <Pace />
)


const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
  third : ThirdRoute,
  fourth : FourthRoute,
  fifth: FifthRoute
});


const ProgramsAndEventsScreen = () => {
  function MyTabBar({ state, descriptors, navigation, position } : MaterialTopTabBarProps) {
    const index = useSharedValue(0)
    const xPosition = useSharedValue(0)
    const TABWIDTH = 100 
    const [ currIndex, setCurrIndex ] = useState(0)

    const selectedTabAnimation = useAnimatedStyle(() => {
      return{
        transform : [{ translateX : withSpring(TABWIDTH * currIndex)}]
      }
    })
    
    return (
      <ScrollView  contentContainerStyle={{ alignItems : "center",  flex : 1, height : 60 }} style={{ width : "110%"}} horizontal className=''>
        <Animated.View style={[{ backgroundColor : "#57BA47" , zIndex : -1, position : "absolute", height : 40, borderRadius : 10, width : TABWIDTH}, selectedTabAnimation]}/>
            {
            state.routes.map((route : any, index : any) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;
      
              const isFocused = state.index === index;



              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
      
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };
              
                  
            const inputRange = state.routes.map((_, i) => i);

            const opacity = position.interpolate({
              inputRange,
              outputRange: inputRange.map(i => (TABWIDTH * i)),
            });
            
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  style={{flex : 1, transform : [{ translateY : isFocused  ? -5 : 0 }], marginHorizontal : 5, width : TABWIDTH}}
                 
                >
                  {/*<View style={{ backgroundColor : isFocused ? "#57BA47" : "#0D509D", zIndex : -1, position : "absolute", height : 40, borderRadius : 10, width : "100%"}}/>*/}
                  <View style={{ height : 40, alignItems : "center", justifyContent : "center", borderRadius : 10 }} className=''>
                    <Text className="text-white font-bold shrink-1 flex-wrap">
                      {label}
                    </Text>
                    
                  </View>                  
                  <View className='items-center justify-center mt-[3%]' style={{ opacity : isFocused ? 1 : 0 }}>
                    <View style={{ backgroundColor : "#57BA47", height : 2, width : "60%"}}/>
                  </View>
                </Pressable>
              );
            })}
      </ScrollView>
    );
  }

  function TabBarIndicator({ position, style, layout, jumpTo, width, getTabWidth } : any ){
    return <></>
  }
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Upcoming' },
    { key: 'second', title: 'Kids'},
    { key: 'third', title : 'Programs & Tarbiya'},
    { key: 'fourth', title : 'Events'},
    { key: 'fifth', title : 'PACE'}
  ]);
  const renderTabBar = (props : any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "45%", width : "15%", left : "2.5%", borderRadius : 20  }}
      style={{ backgroundColor: '#0D509D', width : "100%", alignSelf : "center", paddingTop : '15%'}}
      labelStyle={{ color : "white", fontWeight : "bold", textAlign :'center' }}
      scrollEnabled
    />
  );

  return (
    <>
      <StatusBar barStyle={"light-content"}/>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
     </>
  );
}

{/*  screenOptions={{
            tabBarStyle : {paddingTop : "16%",backgroundColor: "#0D509D", },
            tabBarIndicatorContainerStyle : {justifyContent: "center", marginLeft: 15},
            tabBarIndicatorStyle: {backgroundColor : "#57BA47", width: 100, marginBottom: 4},
            tabBarLabelStyle : {color: "white", fontWeight: "bold", textShadowColor: "black", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0.6},
            tabBarScrollEnabled: true
          }} */}

{
  /*
   tabBarStyle : { paddingTop : "15%", backgroundColor: "#0D509D"},
            tabBarIndicatorStyle : { backgroundColor : "#57BA47", position : "absolute", zIndex : -1, bottom  : "2%", height: "40%", borderRadius: 10, },
            tabBarLabelStyle : {color : "white", fontWeight : "bold", },
            
            tabBarScrollEnabled : true
            */
}


{
  /*
  <Tabs.Navigator 
          screenOptions={{ 
          tabBarStyle : {paddingTop : "16%",backgroundColor: "#0D509D", },
          tabBarIndicatorStyle: {backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "10%", height: "30%", width : "15%", left : "3.6%", borderRadius : 20 },
          tabBarLabelStyle : {color: "white", fontWeight: "bold" },
          tabBarContentContainerStyle : {paddingHorizontal : 10},
          tabBarScrollEnabled: true,
          tabBarItemStyle : { width : 150 },
          tabBarBounces : true
          }}
        >
          <Tabs.Screen name='Upcoming' component={UpcomingEvents} />
          <Tabs.Screen name='Kids' component={Kids} />
          <Tabs.Screen name="Programs & Tarbiya"  component={ProgramsScreen} />
          <Tabs.Screen name="Events" component={Event} />
          <Tabs.Screen name="P.A.C.E" component={Pace} />
        </Tabs.Navigator>
      */
  
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    
  },
  tabLabel: {
    color: '#000',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: 100, // assuming each tab has equal width, customize as needed
    backgroundColor: 'blue',
  },
});

export default ProgramsAndEventsScreen