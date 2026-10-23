import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { useHazards } from '../hooks/useHazards';
import { useWarnings } from '../hooks/useWarnings';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootTabParamList = {
  Map: undefined;
  Alerts: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const MeteoNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#020617',
    card: '#070d1a',
    text: '#f8fafc',
    border: '#1e293b',
    primary: '#38bdf8',
  },
};

export const AppNavigator: React.FC = () => {
  const { warnings } = useWarnings();
  const { hazards } = useHazards();

  const alertCount = Math.max(
    warnings.filter((w) => w.currentAlertLevel !== 'GREEN').length,
    hazards.events.length
  );

  return (
    <NavigationContainer theme={MeteoNavTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 58,
            paddingTop: 4,
            paddingBottom: 6,
            backgroundColor: '#070d1a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#38bdf8',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
          },
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarLabel: 'Map',
            tabBarIcon: () => <Text style={{ fontSize: 17 }}>🗺️</Text>,
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            tabBarLabel: 'Alerts',
            tabBarBadge: alertCount > 0 ? alertCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '900',
            },
            tabBarIcon: () => <Text style={{ fontSize: 17 }}>⚠️</Text>,
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarLabel: 'Analytics',
            tabBarIcon: () => <Text style={{ fontSize: 17 }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: () => <Text style={{ fontSize: 17 }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
