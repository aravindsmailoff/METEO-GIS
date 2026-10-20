import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { runNativeRuntimeVerification } from './src/safety/runtimeAudit';
import { useAppStore } from './src/store/appStore';

export default function App() {
  const hydratePreferences = useAppStore((s) => s.hydratePreferences);

  useEffect(() => {
    hydratePreferences().finally(() => {
      runNativeRuntimeVerification();
    });
  }, [hydratePreferences]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
