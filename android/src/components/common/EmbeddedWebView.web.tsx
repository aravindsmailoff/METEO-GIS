import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { validateAnalyticsBridgeMessage } from '../../safety/webviewBridge';
import type { EmbeddedWebViewProps } from './EmbeddedWebView';

export const EmbeddedWebView: React.FC<EmbeddedWebViewProps> = ({
  uri,
  onLoaded,
  onFailed,
  onOpenRadarStation,
  height = 460,
}) => {
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const result = validateAnalyticsBridgeMessage({
        rawData: ev.data,
        messageOrigin: ev.origin,
        targetUri: uri,
        currentWindowOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      if (result.valid && result.type === 'OPEN_RADAR' && onOpenRadarStation) {
        onOpenRadarStation(result.stationCode);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onOpenRadarStation, uri]);

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        src={uri}
        title="MeteoGIS Embedded Analytics"
        onLoad={() => onLoaded?.()}
        onError={() => onFailed?.()}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#080d19',
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
});
