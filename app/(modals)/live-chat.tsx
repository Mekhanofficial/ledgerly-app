import { useTheme } from '@/context/ThemeContext';
import { useLiveChat } from '@/context/LiveChatContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LiveChatScreen() {
  const { colors } = useTheme();
  const { messages, isTyping, sendMessage, clearChat } = useLiveChat();
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    sendMessage(draft);
    setDraft('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Live Chat</Text>
          <View style={styles.headerStatus}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>Support online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.sender === 'user' ? styles.messageRowUser : styles.messageRowSupport,
            ]}
          >
            <View
              style={[
                styles.bubble,
                message.sender === 'user'
                  ? { backgroundColor: colors.primary500 }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  message.sender === 'user' ? { color: '#ffffff' } : { color: colors.text },
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowSupport]}>
            <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.typingText, { color: colors.textTertiary }]}>Support is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: insets.bottom || 12 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message..."
            placeholderTextColor={colors.textLight}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: draft.trim() ? colors.primary500 : colors.border },
            ]}
            disabled={!draft.trim()}
          >
            <Ionicons name="send" size={18} color={draft.trim() ? '#ffffff' : colors.textLight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowSupport: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingBubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
