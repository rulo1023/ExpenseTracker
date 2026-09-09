import Ionicons from '@expo/vector-icons/Ionicons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type FeedbackTone =
  | 'success'
  | 'error'
  | 'info';

type FeedbackMessage = {
  text: string;
  tone: FeedbackTone;
};

type FeedbackContextValue = {
  showFeedback: (
    text: string,
    tone?: FeedbackTone
  ) => void;
};

const FeedbackContext =
  createContext<FeedbackContextValue | null>(
    null
  );

export function FeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [message, setMessage] =
    useState<FeedbackMessage | null>(null);
  const opacity = useRef(
    new Animated.Value(0)
  ).current;
  const translateY = useRef(
    new Animated.Value(-12)
  ).current;
  const timer = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -8,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setMessage(null));
  }, [opacity, translateY]);

  const showFeedback = useCallback(
    (
      text: string,
      tone: FeedbackTone = 'success'
    ) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      setMessage({ text, tone });
      opacity.setValue(0);
      translateY.setValue(-12);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();

      timer.current = setTimeout(
        hide,
        2600
      );
    },
    [hide, opacity, translateY]
  );

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const icon =
    message?.tone === 'error'
      ? 'alert-circle'
      : message?.tone === 'info'
        ? 'information-circle'
        : 'checkmark-circle';

  return (
    <FeedbackContext.Provider
      value={{ showFeedback }}
    >
      {children}

      <View
        pointerEvents="none"
        style={styles.layer}
      >
        {message && (
          <Animated.View
            style={[
              styles.toast,
              message.tone === 'error' &&
                styles.toastError,
              message.tone === 'info' &&
                styles.toastInfo,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.text}>
              {message.text}
            </Text>
          </Animated.View>
        )}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(
    FeedbackContext
  );

  if (!context) {
    throw new Error(
      'useFeedback must be used inside FeedbackProvider'
    );
  }

  return context;
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
  },

  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    maxWidth: '90%',
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 12,
  },

  toastError: {
    backgroundColor: '#B91C1C',
  },

  toastInfo: {
    backgroundColor: '#4338CA',
  },

  text: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
});
