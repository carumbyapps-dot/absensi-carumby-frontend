import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '@/theme';

interface Props {
  latitude: number;
  longitude: number;
  height?: number;
}

export default function MapPreview({ latitude, longitude, height = 160 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} pinColor={colors.red} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  map: {
    flex: 1,
  },
});