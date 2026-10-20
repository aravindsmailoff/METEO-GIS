import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
      try {
        const parsed = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (parsed?.type === 'OPEN_RADAR' && parsed.stationCode && onOpenRadarStation) {
          onOpenRadarStation(parsed.stationCode);
        }
      } catch {
        // Ignore unrelated window messages
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onOpenRadarStation]);

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
