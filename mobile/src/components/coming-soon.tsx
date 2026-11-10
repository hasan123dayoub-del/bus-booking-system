import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function ComingSoon({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.mark}>رحلتي</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>ستتوفر هذه الصفحة قريباً.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.canvas,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: 28,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  mark: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    marginTop: 14,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
  },
});
