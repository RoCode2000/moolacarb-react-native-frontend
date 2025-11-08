import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";

const FLOWISE_API_URL =
  `http://4.190.64.83:3000/api/v1/prediction/49b93980-e061-4950-a5f1-a5badc81fd64`;

// Helper to format text with * and ** patterns
const formatMessage = (text: string) => {
  // Split text into lines
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    let content: any[] = [];

    // If line starts with a single asterisk, treat it as a bullet point
    if (trimmed.startsWith("* ")) {
      const processed = trimmed.replace(/^\* /, "• ");
      const parts = processed.split(/\*\*(.*?)\*\*/g);
      parts.forEach((part, i) => {
        if (i % 2 === 1) {
          // Bold section
          content.push(
            <Text key={i} style={{ fontWeight: "bold" }}>
              {part}
            </Text>
          );
        } else {
          content.push(part);
        }
      });
    } else {
      // Normal line (with possible bold)
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      parts.forEach((part, i) => {
        if (i % 2 === 1) {
          content.push(
            <Text key={i} style={{ fontWeight: "bold" }}>
              {part}
            </Text>
          );
        } else {
          content.push(part);
        }
      });
    }

    return (
      <Text key={index} style={{ marginBottom: 4 }}>
        {content}
      </Text>
    );
  });
};

export default function ChatBotOverlay({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(FLOWISE_API_URL, {
        question: input,
      });

      const botMessage = {
        role: "bot",
        content: response.data?.text || "No response",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error connecting to chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.chatBox}>
          <View style={styles.header}>
            <Text style={styles.title}>MoolaBot</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.message,
                  item.role === "user" ? styles.userMsg : styles.botMsg,
                ]}
              >
                {item.role === "bot" ? (
                  <View style={styles.formattedText}>{formatMessage(item.content)}</View>
                ) : (
                  <Text style={[styles.msgText, { color: "#fff" }]}>
                    {item.content}
                  </Text>
                )}
              </View>
            )}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity onPress={sendMessage} disabled={loading}>
              <Icon name="send" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  chatBox: {
    backgroundColor: "#fff",
    height: "65%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  title: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  message: {
    margin: 8,
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userMsg: {
    backgroundColor: "#007bff",
    alignSelf: "flex-end",
  },
  botMsg: {
    backgroundColor: "#e9ecef",
    alignSelf: "flex-start",
  },
  msgText: { color: "#000" },
  formattedText: {
    color: "#000",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
});
