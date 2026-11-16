import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

const tabIcons: Record<string, string> = {
  index: '⌂',
  bookings: '▤',
  account: '◉',
};

const tabLabels: Record<string, string> = {
  index: 'الرئيسية',
  bookings: 'حجوزاتي',
  account: 'حسابي',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        },
        tabBarLabel: tabLabels[route.name],
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 21, lineHeight: 24 }}>
            {tabIcons[route.name]}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
