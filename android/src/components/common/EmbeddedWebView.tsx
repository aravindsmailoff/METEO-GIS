import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface EmbeddedWebViewProps {
  uri: string;
  onLoaded?: () => void;
  onFailed?: () => void;
  onOpenRadarStation?: (code: string) => void;
  height?: number;
}

export const EmbeddedWebView: React.FC<EmbeddedWebViewProps> = ({
  uri,
  onLoaded,
  onFailed,
  onOpenRadarStation,
  height = 460,
}) => {
  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        nestedScrollEnabled
        onLoadEnd={() => onLoaded?.()}
        onError={() => onFailed?.()}
        onHttpError={() => onFailed?.()}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data);
            if (parsed?.type === 'OPEN_RADAR' && parsed.stationCode && onOpenRadarStation) {
              onOpenRadarStation(parsed.stationCode);
            }
          } catch {
            // Ignore non-JSON postMessages
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#080d19',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  webview: {
    flex: 1,
    backgroundColor: '#080d19',
  },
});
