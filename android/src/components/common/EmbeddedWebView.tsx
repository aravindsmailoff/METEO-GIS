import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { WEBVIEW_ORIGIN_WHITELIST } from '../../config/api';
import { validateAnalyticsBridgeMessage } from '../../safety/webviewBridge';

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
        originWhitelist={WEBVIEW_ORIGIN_WHITELIST}
        onLoadEnd={() => onLoaded?.()}
        onError={() => onFailed?.()}
        onHttpError={() => onFailed?.()}
        onMessage={(event) => {
          const result = validateAnalyticsBridgeMessage({
            rawData: event.nativeEvent.data,
            messageOrigin: event.nativeEvent.url
              ? (() => {
                  try {
                    return new URL(event.nativeEvent.url).origin;
                  } catch {
                    return 'invalid://origin';
                  }
                })()
              : undefined,
            targetUri: uri,
          });
          if (result.valid && result.type === 'OPEN_RADAR' && onOpenRadarStation) {
            onOpenRadarStation(result.stationCode);
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
