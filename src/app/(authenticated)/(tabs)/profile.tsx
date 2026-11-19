import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert, Image,
  Modal,
  ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity, View,
} from "react-native";
import {
  getLikedReviewPosts,
  getUserReaction,
  ReviewPost,
  ReviewReaction,
  updateReviewReaction,
  USER_AVATAR_URL,
} from "../../../lib/api";

const reactionEmojis: Record<ReviewReaction, string> = {
  like: "❤️",
  love: "🔥",
  popcorn: "🍿",
};

export default function ProfileScreen() {
  const [name, setName] = useState("Jade Dadang");
  const [username, setUsername] = useState("jadedadang");
  const [email, setEmail] = useState("jadedadang@email.com");
  const [location, setLocation] = useState("Philippines");
  const [about, setAbout] = useState("HI.");
  const [editVisible, setEditVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingReactionPostId, setUpdatingReactionPostId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const loadLikedPosts = useCallback(async (isCurrent: () => boolean = () => true) => {
    try {
      const saved = await getLikedReviewPosts();
      if (isCurrent()) setLikedPosts(saved);
    } catch {
      if (isCurrent()) {
        setFeedback({
          title: "Connection error",
          message: "Unable to load liked posts. Check your connection and try again.",
        });
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      void loadLikedPosts(() => isCurrent);
      return () => {
        isCurrent = false;
      };
    }, [loadLikedPosts])
  );

  const removeReaction = async (post: ReviewPost) => {
    if (updatingReactionPostId) return;
    setUpdatingReactionPostId(post.id);
    try {
      await updateReviewReaction(post, null);
      setLikedPosts((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setFeedback({
        title: "Could not remove reaction",
        message: "Your reaction was not removed. Check your connection and try again.",
      });
    } finally {
      setUpdatingReactionPostId(null);
    }
  };

  const saveProfile = () => {
    if (!name.trim() || !username.trim() || !email.trim()) {
      Alert.alert("Missing information", "Name, username, and email are required.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    setName(name.trim());
    setUsername(username.trim());
    setEmail(email.trim());
    setLocation(location.trim());
    setAbout(about.trim());
    setEditVisible(false);
    Alert.alert("Profile updated", "Your profile information has been updated.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Image
            source={{ uri: USER_AVATAR_URL }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Full Name</Text><Text style={styles.detailValue}>{name}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Username</Text><Text style={styles.detailValue}>@{username}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Email</Text><Text style={styles.detailValue}>{email}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Location</Text><Text style={styles.detailValue}>{location}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>About Me</Text><Text style={styles.detailValue}>{about}</Text></View>
        </View>

        <View style={styles.likedSection}>
          <View style={styles.likedHeading}>
            <Text style={styles.sectionTitle}>♥ Liked Posts</Text>
            <Text style={styles.count}>{likedPosts.length} posts</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#E50914" style={{ margin: 20 }} />
          ) : likedPosts.length === 0 ? (
            <Text style={styles.emptyText}>Posts you react to on Home will appear here.</Text>
          ) : (
            likedPosts.map((post) => {
              const reaction = getUserReaction(post);
              return (
                <View key={post.id} style={styles.likedPost}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.likedImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.likedImagePlaceholder}>
                      <Text style={styles.placeholderIcon}>🎬</Text>
                    </View>
                  )}
                  <View style={styles.likedInfo}>
                    <Text style={styles.likedMovieTitle} numberOfLines={1}>{post.movieTitle}</Text>
                    <Text style={styles.likedReaction}>
                      {reaction ? reactionEmojis[reaction] : "❤️"} You reacted
                    </Text>
                    <Text style={styles.likedReview} numberOfLines={2}>{post.reviewText}</Text>
                    <TouchableOpacity
                      onPress={() => void removeReaction(post)}
                      disabled={updatingReactionPostId !== null}
                    >
                      <Text style={styles.removeReactionText}>
                        {updatingReactionPostId === post.id ? "REMOVING..." : "REMOVE REACTION"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={() => void loadLikedPosts()}>
            <Text style={styles.refreshText}>↻ Refresh liked posts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#999" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor="#999" value={location} onChangeText={setLocation} />
            <TextInput style={[styles.input, styles.aboutInput]} placeholder="About me" placeholderTextColor="#999" value={about} onChangeText={setAbout} multiline />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditVisible(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveText}>SAVE CHANGES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={feedback !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedback(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{feedback?.title}</Text>
            <Text style={styles.feedbackMessage}>{feedback?.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setFeedback(null)}
              >
                <Text style={styles.saveText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  header: { backgroundColor: "#111111", padding: 18, borderBottomWidth: 1, borderBottomColor: "#252525" },
  headerTitle: { fontSize: 21, fontWeight: "bold", color: "#FFFFFF" },
  profile: { backgroundColor: "#252525", alignItems: "center", padding: 25 },
  profileImage: { width: 110, height: 110, borderRadius: 60, borderWidth: 3, borderColor: "#E50914" },
  name: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF", marginTop: 15 },
  username: { fontSize: 14, color: "#AAAAAA", marginTop: 5 },
  editButton: { backgroundColor: "#E50914", paddingVertical: 12, paddingHorizontal: 35, borderRadius: 8, marginTop: 18 },
  editButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 13 },
  details: { backgroundColor: "#252525", marginTop: 12, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginBottom: 15 },
  detailItem: { borderBottomWidth: 1, borderBottomColor: "#3A3A3A", paddingVertical: 13 },
  detailLabel: { fontSize: 12, color: "#AAAAAA", marginBottom: 5 },
  detailValue: { fontSize: 15, color: "#FFFFFF", fontWeight: "500" },
  likedSection: { backgroundColor: "#252525", marginTop: 12, padding: 20, marginBottom: 25 },
  likedHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  count: { color: "#E50914", fontSize: 13, fontWeight: "bold" },
  emptyText: { color: "#AAAAAA", lineHeight: 21, paddingVertical: 10 },
  likedPost: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#3A3A3A" },
  likedImage: { width: 78, height: 100, borderRadius: 7, backgroundColor: "#333333" },
  likedImagePlaceholder: { width: 78, height: 100, borderRadius: 7, backgroundColor: "#333333", alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 26 },
  likedInfo: { flex: 1, paddingLeft: 13, justifyContent: "center" },
  likedMovieTitle: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  likedReaction: { color: "#FFC857", fontSize: 12, marginTop: 4 },
  likedReview: { color: "#BBBBBB", fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 8 },
  removeReactionText: { color: "#FF7777", fontSize: 10, fontWeight: "bold" },
  refreshButton: { borderWidth: 1, borderColor: "#E50914", borderRadius: 7, padding: 11, alignItems: "center", marginTop: 16 },
  refreshText: { color: "#FFFFFF", fontWeight: "600" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#252525", borderRadius: 12, padding: 20 },
  modalTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  feedbackMessage: { color: "#DDDDDD", lineHeight: 21, marginBottom: 8 },
  input: { backgroundColor: "#111111", color: "#FFFFFF", borderRadius: 7, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#444" },
  aboutInput: { minHeight: 75, textAlignVertical: "top" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  cancelButton: { padding: 12 },
  cancelText: { color: "#AAAAAA", fontWeight: "bold" },
  saveButton: { backgroundColor: "#E50914", padding: 12, borderRadius: 7 },
  saveText: { color: "#FFFFFF", fontWeight: "bold" },
});

