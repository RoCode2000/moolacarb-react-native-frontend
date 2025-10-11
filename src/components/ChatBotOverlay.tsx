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
  "http://10.0.2.2:3000/api/v1/prediction/af20da84-f6c4-486a-84f7-5f1a40a9fa42";

export default function ChatBotOverlay() {
  const [visible, setVisible] = useState(false);
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
    <>
      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
      >
        <Icon name="chat-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.chatBox}>
            <View style={styles.header}>
              <Text style={styles.title}>MoolaBot</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
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
                  <Text style={styles.msgText}>{item.content}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 85,
    left: 20,
    backgroundColor: "#007bff",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
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
