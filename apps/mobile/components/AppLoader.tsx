import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Easing, Modal } from 'react-native';
import { ForestGreen, DarkForest, AppFont } from '@/constants/Colors';

interface AppLoaderProps {
  visible?: boolean;
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function AppLoader({
  visible = true,
  message = '',
  fullScreen = false,
  size = 'medium',
}: AppLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  if (!visible) return null;

  const logoDimensions =
    size === 'small'
      ? { width: 120, height: 34 }
      : size === 'large'
      ? { width: 180, height: 50 }
      : { width: 150, height: 42 };

  const content = (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={[styles.logoImage, logoDimensions]}
          resizeMode="contain"
        />
      </Animated.View>

      {message ? (
        <View style={styles.messageRow}>
          <View style={styles.dot} />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        <View style={styles.transparentOverlay}>
          {content}
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  transparentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'transparent',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 150,
    height: 42,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ForestGreen,
  },
  messageText: {
    fontSize: 12,
    color: DarkForest,
    fontFamily: AppFont,
    fontWeight: '600',
  },
});
