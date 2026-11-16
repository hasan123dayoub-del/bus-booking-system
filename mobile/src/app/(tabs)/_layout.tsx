import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'الرئيسية', icon: 'home-outline' },
  bookings: { label: 'حجوزاتي', icon: 'ticket-outline' },
  account: { label: 'حسابي', icon: 'person-outline' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8E9A96',
        tabBarStyle: {
          height: 84,
          paddingTop: 10,
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: colors.surface,
          position: 'absolute',
          shadowColor: '#064A3B',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarLabel: TABS[route.name]?.label,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12, marginTop: 4 },
        tabBarIcon: ({ color, focused }) => (
          <View
            style={{
              width: 60,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? colors.primarySoft : 'transparent',
            }}
          >
            <Ionicons name={TABS[route.name]?.icon ?? 'ellipse-outline'} size={22} color={String(color)} />
          </View>
        ),
      })}
    >
      {/* Tabs are drawn left to right, so Home goes last to sit on the right (RTL).
          The app still opens on Home: expo-router picks the tab from the URL "/". */}
      <Tabs.Screen name="account" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
