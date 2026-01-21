import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DEFAULT_API = "http://localhost:8000";

const headingFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

const bodyFont = Platform.select({
  ios: "Avenir Next",
  android: "sans-serif",
  default: "sans-serif",
});

export default function App() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API;

  const isReady = useMemo(
    () => Boolean(url.trim()) || Boolean(text.trim()),
    [url, text]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRead = async () => {
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    if (trimmedUrl && trimmedText) {
      setStatus("Please provide either a URL or text, not both.");
      return;
    }
    if (!trimmedUrl && !trimmedText) {
      setStatus("Please provide a URL or some text.");
      return;
    }

    const payload = trimmedUrl ? { url: trimmedUrl } : { text: trimmedText };

    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to start reading.");
      }
      setStatus("Reading started. Check your system audio output.");
    } catch (err) {
      setStatus(err?.message || "Unable to reach the API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundBase} />
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.eyebrow}>Read Aloud</Text>
          <Text style={styles.title}>Turn text or links into audio.</Text>
          <Text style={styles.subtitle}>
            Provide a link or paste text. The server will fetch and read it
            aloud using native TTS.
          </Text>

          <Text style={styles.label}>Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/article"
            placeholderTextColor="#6b5c5c"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Text</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Paste text to read aloud"
            placeholderTextColor="#6b5c5c"
            value={text}
            onChangeText={setText}
            multiline
          />

          <Pressable
            onPress={handleRead}
            disabled={!isReady || isLoading}
            style={({ pressed }) => [
              styles.button,
              (!isReady || isLoading) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#f9f3e9" />
            ) : (
              <Text style={styles.buttonText}>Read Aloud</Text>
            )}
          </Pressable>

          {status ? <Text style={styles.status}>{status}</Text> : null}
          <Text style={styles.hint}>
            API: {apiBaseUrl} (set EXPO_PUBLIC_API_BASE_URL to change)
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6efe7",
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f6efe7",
  },
  backgroundOrbA: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#f2c7a0",
    opacity: 0.6,
  },
  backgroundOrbB: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#c3d4c8",
    opacity: 0.65,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff7ee",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4b3f3f",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  eyebrow: {
    fontFamily: bodyFont,
    color: "#a34c2f",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: headingFont,
    fontSize: 28,
    color: "#2b2623",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: bodyFont,
    fontSize: 15,
    color: "#514844",
    marginBottom: 20,
    lineHeight: 22,
  },
  label: {
    fontFamily: bodyFont,
    fontSize: 13,
    color: "#4d3b36",
    marginBottom: 8,
  },
  input: {
    fontFamily: bodyFont,
    backgroundColor: "#fefaf6",
    borderColor: "#e2cbb9",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    color: "#2b2623",
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#2f4f4f",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: bodyFont,
    fontSize: 16,
    color: "#f9f3e9",
    letterSpacing: 0.4,
  },
  status: {
    fontFamily: bodyFont,
    marginTop: 16,
    color: "#5a3f36",
  },
  hint: {
    fontFamily: bodyFont,
    marginTop: 10,
    color: "#8b6b5f",
    fontSize: 12,
  },
});
