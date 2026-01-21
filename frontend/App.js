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
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";

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
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [speed, setSpeed] = useState(1.0);
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

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/voices`);
        const data = await response.json();
        if (response.ok && Array.isArray(data?.voices)) {
          setVoices(data.voices);
        }
      } catch (err) {
        setStatus("Unable to load voices from the API.");
      }
    };
    fetchVoices();
  }, [apiBaseUrl]);

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
    if (voiceId) {
      payload.voice = voiceId;
    }
    payload.speed = speed;

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

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await fetch(`${apiBaseUrl}/stop`, { method: "POST" });
      setStatus("Reading stopped.");
    } catch (err) {
      setStatus("Unable to stop the reader.");
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

          <Text style={styles.label}>Voice</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={voiceId}
              onValueChange={setVoiceId}
              style={styles.picker}
            >
              <Picker.Item label="System default" value="" />
              {voices.map((voice) => (
                <Picker.Item
                  key={voice.id}
                  label={`${voice.name}${voice.locale ? ` (${voice.locale})` : ""}`}
                  value={voice.voice_id || voice.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.speedRow}>
            <Text style={styles.label}>Speed</Text>
            <Text style={styles.speedValue}>{speed.toFixed(1)}x</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.6}
            maximumValue={1.8}
            step={0.1}
            value={speed}
            onValueChange={setSpeed}
            minimumTrackTintColor="#2f4f4f"
            maximumTrackTintColor="#d8c6b8"
            thumbTintColor="#2f4f4f"
          />

          <View style={styles.buttonRow}>
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
            <Pressable
              onPress={handleStop}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.buttonSecondary,
                isLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonTextSecondary}>Stop</Text>
            </Pressable>
          </View>

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
  pickerWrap: {
    backgroundColor: "#fefaf6",
    borderColor: "#e2cbb9",
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    color: "#2b2623",
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  speedValue: {
    fontFamily: bodyFont,
    color: "#2b2623",
  },
  slider: {
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#2f4f4f",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonSecondary: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f4f4f",
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
  buttonTextSecondary: {
    fontFamily: bodyFont,
    fontSize: 16,
    color: "#2f4f4f",
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
