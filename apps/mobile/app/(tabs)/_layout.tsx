import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors, { ForestGreen, AppFont } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ForestGreen,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 22 : 16,
          width: 280,
          left: '50%',
          marginLeft: 42, // Perfectly centers the 280px pill in any parent container
          height: 54,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderRadius: 38, // High-curvature compact pill shape
          borderTopWidth: 0,
          borderWidth: 1.8,
          borderColor: 'rgba(208, 235, 216, 0.85)',
          elevation: 14, // Android elevation
          shadowColor: '#123E25', // iOS deep shadow
          shadowOffset: {
            width: 0,
            height: 9,
          },
          shadowOpacity: 0.16,
          shadowRadius: 14,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500',
          fontFamily: AppFont,
          marginTop: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={15}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={14}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'bag-handle' : 'bag-handle-outline'}
                size={15}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={15}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={16}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null, // Hide template tab
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    backgroundColor: '#86b691ff', // Soft Forest Green highlight
  },
});
