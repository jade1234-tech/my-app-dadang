import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addReviewComment,
  addReviewPost,
  getReviewPosts,
  getUserReaction,
  removeReviewPost,
  ReviewPost,
  ReviewReaction,
  updateReviewPost,
  updateReviewReaction,
  USER_AVATAR_URL,
  USER_ID,
} from "../../../lib/api";

const ratings = [1, 2, 3, 4, 5];
const reactionOptions: { key: ReviewReaction; emoji: string; label: string }[] = [
  { key: "like", emoji: "❤️", label: "Like" },
  { key: "love", emoji: "🔥", label: "Fire" },
  { key: "popcorn", emoji: "🍿", label: "Popcorn" },
];

const isImageUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);
const isPinterestShareUrl = (value: string) =>
  /^https?:\/\/(?:www\.)?(?:pin\.it|pinterest\.com)(?:\/|$)/i.test(value);

export default function HomeScreen() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<ReviewPost | null>(null);
  const [movieTitle, setMovieTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<ReviewPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = useCallback(async (isCurrent: () => boolean = () => true) => {
    try {
      const saved = await getReviewPosts();
      if (isCurrent()) setPosts(saved);
    } catch {
      if (isCurrent()) {
        Alert.alert("Connection error", "Unable to load reviews. Check your connection and try again.");
      }
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      void loadPosts(() => isCurrent);
      return () => {
        isCurrent = false;
      };
    }, [loadPosts])
  );

  const refreshPosts = () => {
    setRefreshing(true);
    void loadPosts();
  };

  const openNewPost = () => {
    setEditingPost(null);
    setMovieTitle("");
    setReviewText("");
    setImageUrl("");
    setPreviewFailed(false);
    setRating(5);
    setEditorVisible(true);
  };

  const openEditPost = (post: ReviewPost) => {
    setEditingPost(post);
    setMovieTitle(post.movieTitle);
    setReviewText(post.reviewText);
    setImageUrl(post.imageUrl ?? "");
    setPreviewFailed(false);
    setRating(post.rating);
    setEditorVisible(true);
  };

  const savePost = async () => {
    const title = movieTitle.trim();
    const text = reviewText.trim();
    const image = imageUrl.trim();
    if (!title || !text) {
      Alert.alert("Missing information", "Enter a movie title and write your review.");
      return;
    }
    if (image && !isImageUrl(image)) {
      Alert.alert("Invalid image URL", "Use a complete image link beginning with http:// or https://.");
      return;
    }
    if (image && isPinterestShareUrl(image)) {
      Alert.alert(
        "Use a direct image link",
        "Pinterest share links open a webpage, not an image. Paste the image address, usually from i.pinimg.com."
      );
      return;
    }

    try {
      setSaving(true);
      if (editingPost) {
        const updated = await updateReviewPost(editingPost, {
          movieTitle: title,
          rating,
          reviewText: text,
          imageUrl: image,
        });
        setPosts((current) =>
          current.map((post) => (post.id === updated.id ? updated : post))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
        setFailedImageIds((current) => {
          const next = { ...current };
          delete next[updated.id];
          return next;
        });
        setEditorVisible(false);
        Alert.alert("Post updated", "Your review changes have been saved.");
      } else {
        const created = await addReviewPost({
          movieTitle: title,
          rating,
          reviewText: text,
          imageUrl: image,
        });
        setPosts((current) =>
          [created, ...current].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
        setEditorVisible(false);
        Alert.alert("Post shared", "Your movie review is now in the feed.");
      }
    } catch {
      Alert.alert("Could not save post", "Your review was not saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const reactToPost = async (post: ReviewPost, reaction: ReviewReaction) => {
    if (reactingPostId || commentingPostId || saving) return;
    const selected = getUserReaction(post);
    const nextReaction = selected === reaction ? null : reaction;

    try {
      setReactingPostId(post.id);
      const updated = await updateReviewReaction(post, nextReaction);
      setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      Alert.alert("Could not react", "Your reaction was not saved. Please try again.");
    } finally {
      setReactingPostId(null);
    }
  };

  const commentOnPost = async (post: ReviewPost) => {
    const text = (commentDrafts[post.id] ?? "").trim();
    if (!text || commentingPostId || reactingPostId || saving) return;

    try {
      setCommentingPostId(post.id);
      const updated = await addReviewComment(post, text);
      setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch {
      Alert.alert("Could not comment", "Your comment was not saved. Check your connection and try again.");
    } finally {
      setCommentingPostId(null);
    }
  };

  const deletePost = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    try {
      setDeleting(true);
      await removeReviewPost(target.id);
      setPosts((current) => current.filter((post) => post.id !== target.id));
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
      Alert.alert("Could not delete post", "The review is still in the feed. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  const renderPost = ({ item }: { item: ReviewPost }) => {
    const authorName = item.authorName || "Movie fan";
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.userId === USER_ID ? (
            <Image source={{ uri: USER_AVATAR_URL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.postDate}>
              @{item.userId} · {new Date(item.createdAt).toLocaleDateString()}
              {item.updatedAt ? " · Edited" : ""}
            </Text>
          </View>
          {item.userId === USER_ID && (
            <View style={styles.ownerActions}>
              <TouchableOpacity onPress={() => openEditPost(item)} accessibilityLabel="Edit post">
                <Text style={styles.ownerActionText}>EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDeleteTarget(item)} accessibilityLabel="Delete post">
                <Text style={styles.deleteActionText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle}>{item.movieTitle}</Text>
          <Text style={styles.rating}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
        </View>

        {item.imageUrl ? (
          failedImageIds[item.id] ? (
            <View style={styles.imageUnavailable}>
              <Text style={styles.imageUnavailableText}>
                This link did not return an image. Use a direct image URL, such as an i.pinimg.com link.
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
              onError={() => setFailedImageIds((current) => ({ ...current, [item.id]: true }))}
            />
          )
        ) : null}

        <Text style={styles.reviewText}>
          <Text style={styles.captionName}>{authorName} </Text>
          {item.reviewText}
        </Text>

        <View style={styles.reactions}>
          {reactionOptions.map((option) => {
            const users = item.reactions?.[option.key] ?? [];
            const selected = users.includes(USER_ID);
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.reactionButton, selected && styles.selectedReaction]}
                onPress={() => void reactToPost(item, option.key)}
                disabled={reactingPostId !== null || commentingPostId !== null || saving}
                accessibilityRole="button"
                accessibilityLabel={`${option.label}, ${users.length} reactions`}
                accessibilityState={{ selected }}
              >
                <Text style={styles.reactionEmoji}>{option.emoji}</Text>
                <Text style={[styles.reactionCount, selected && styles.selectedReactionText]}>
                  {users.length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {item.comments && item.comments.length > 0 && (
          <View style={styles.comments}>
            {item.comments.map((comment) => (
              <Text key={comment.id} style={styles.commentText}>
                <Text style={styles.commentAuthor}>{comment.authorName} </Text>
                {comment.text}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.commentComposer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#999999"
            value={commentDrafts[item.id] ?? ""}
            onChangeText={(text) => setCommentDrafts((current) => ({ ...current, [item.id]: text }))}
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => void commentOnPost(item)}
          />
          <TouchableOpacity
            onPress={() => void commentOnPost(item)}
            disabled={
              !commentDrafts[item.id]?.trim() ||
              commentingPostId !== null ||
              reactingPostId !== null ||
              saving
            }
            accessibilityRole="button"
            accessibilityLabel="Post comment"
          >
            <Text
              style={[
                styles.commentPostButton,
                (
                  !commentDrafts[item.id]?.trim() ||
                  commentingPostId !== null ||
                  reactingPostId !== null ||
                  saving
                ) && styles.commentPostDisabled,
              ]}
            >
              {commentingPostId === item.id ? "..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MOVIE REVIEWER</Text>
        <TouchableOpacity style={styles.headerComposeButton} onPress={openNewPost}>
          <Text style={styles.headerComposeText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#E50914" />
          <Text style={styles.emptyText}>Loading your feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.feed}
          onRefresh={refreshPosts}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.feedIntro}>
              <Image source={{ uri: USER_AVATAR_URL }} style={styles.avatarImage} />
              <TouchableOpacity style={styles.composerPrompt} onPress={openNewPost}>
                <Text style={styles.composerText}>Share a movie review...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={openNewPost} accessibilityLabel="Create a post with an image">
                <Text style={styles.photoButtonText}>▧</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your feed is ready</Text>
              <Text style={styles.emptyText}>Share the first movie review with the community.</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openNewPost}>
                <Text style={styles.emptyButtonText}>Write a review</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal
        visible={editorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) setEditorVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editingPost ? "Edit your post" : "Create a post"}</Text>
              <TextInput
                style={styles.input}
                placeholder="Movie title"
                placeholderTextColor="#999"
                value={movieTitle}
                onChangeText={setMovieTitle}
                maxLength={100}
                returnKeyType="next"
              />
              <Text style={styles.ratingLabel}>Your rating</Text>
              <View style={styles.ratingPicker}>
                {ratings.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.ratingOption}
                    onPress={() => setRating(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} out of 5 stars`}
                    accessibilityState={{ selected: rating === value }}
                  >
                    <Text style={[styles.ratingOptionText, value <= rating && styles.ratingOptionSelected]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.reviewInput]}
                placeholder="Write your review..."
                placeholderTextColor="#999"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <TextInput
                style={styles.input}
                placeholder="Direct image URL (optional)"
                placeholderTextColor="#999"
                value={imageUrl}
                onChangeText={(value) => {
                  setImageUrl(value);
                  setPreviewFailed(false);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {imageUrl.trim() && isPinterestShareUrl(imageUrl.trim()) ? (
                <Text style={styles.imageHint}>
                  Pinterest share links are webpages. Use the direct image address, usually from i.pinimg.com.
                </Text>
              ) : imageUrl.trim() && isImageUrl(imageUrl.trim()) ? (
                previewFailed ? (
                  <Text style={styles.imageHint}>
                    This link did not return an image. Try a direct .jpg, .png, or .webp image link.
                  </Text>
                ) : (
                  <Image
                    source={{ uri: imageUrl.trim() }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                    onError={() => setPreviewFailed(true)}
                  />
                )
              ) : null}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditorVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={savePost} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>{editingPost ? "SAVE CHANGES" : "SHARE POST"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete this post?</Text>
            <Text style={styles.confirmText}>
              Your review of {deleteTarget?.movieTitle} will be permanently deleted.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={deletePost} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>DELETE</Text>
                )}
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
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#111111",
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  logo: { color: "#E50914", fontSize: 20, fontWeight: "900", letterSpacing: 0.6 },
  headerComposeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#252525", alignItems: "center", justifyContent: "center" },
  headerComposeText: { color: "#FFFFFF", fontSize: 28, lineHeight: 32, fontWeight: "300" },
  feed: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, paddingBottom: 24 },
  feedIntro: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#252525" },
  avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
  composerPrompt: { flex: 1, marginHorizontal: 11, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: "#444444" },
  composerText: { color: "#AAAAAA", fontSize: 14 },
  photoButton: { paddingHorizontal: 6, paddingVertical: 8 },
  photoButtonText: { color: "#65C466", fontSize: 25 },
  postCard: { backgroundColor: "#181818", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#292929" },
  postHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12 },
  authorInfo: { flex: 1, marginLeft: 10 },
  authorName: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  postDate: { color: "#999999", fontSize: 11, marginTop: 3 },
  ownerActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  ownerActionText: { color: "#DDDDDD", fontSize: 10, fontWeight: "bold" },
  deleteActionText: { color: "#FF7777", fontSize: 10, fontWeight: "bold" },
  movieInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingBottom: 10 },
  movieTitle: { flex: 1, color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginRight: 10 },
  rating: { color: "#FFC857", fontSize: 15, letterSpacing: 1 },
  postImage: { width: "100%", aspectRatio: 1, backgroundColor: "#252525" },
  imageUnavailable: { width: "100%", aspectRatio: 1, backgroundColor: "#252525", justifyContent: "center", padding: 28 },
  imageUnavailableText: { color: "#BBBBBB", textAlign: "center", lineHeight: 21 },
  reviewText: { color: "#DDDDDD", fontSize: 14, lineHeight: 21, paddingHorizontal: 15, paddingTop: 12 },
  captionName: { color: "#FFFFFF", fontWeight: "bold" },
  reactions: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  reactionButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 18, backgroundColor: "#252525" },
  selectedReaction: { backgroundColor: "#492025", borderWidth: 1, borderColor: "#E50914" },
  reactionEmoji: { fontSize: 15 },
  reactionCount: { color: "#BBBBBB", fontSize: 12, fontWeight: "600" },
  selectedReactionText: { color: "#FFFFFF" },
  comments: { paddingHorizontal: 15, gap: 7, marginBottom: 10 },
  commentText: { color: "#DDDDDD", fontSize: 13, lineHeight: 19 },
  commentAuthor: { color: "#FFFFFF", fontWeight: "bold" },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 14,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: "#252525",
  },
  commentPostButton: { color: "#E50914", fontSize: 13, fontWeight: "bold" },
  commentPostDisabled: { color: "#777777" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold", marginBottom: 7 },
  emptyText: { color: "#AAAAAA", textAlign: "center", lineHeight: 20, paddingHorizontal: 18 },
  emptyButton: { marginTop: 18, backgroundColor: "#E50914", borderRadius: 7, paddingVertical: 11, paddingHorizontal: 16 },
  emptyButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  modalBackground: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.78)", padding: 18 },
  modalScrollContent: { flexGrow: 1, justifyContent: "center" },
  modalCard: { backgroundColor: "#252525", borderRadius: 12, padding: 20 },
  modalTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold", marginBottom: 14 },
  input: { backgroundColor: "#111111", color: "#FFFFFF", borderRadius: 7, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#444444", fontSize: 15 },
  ratingLabel: { color: "#DDDDDD", fontSize: 13, marginBottom: 7 },
  ratingPicker: { flexDirection: "row", justifyContent: "space-between", marginBottom: 13 },
  ratingOption: { flex: 1, alignItems: "center", paddingVertical: 7 },
  ratingOptionText: { color: "#666666", fontSize: 27 },
  ratingOptionSelected: { color: "#FFC857" },
  reviewInput: { minHeight: 100 },
  imagePreview: { width: "100%", aspectRatio: 1.3, borderRadius: 8, marginBottom: 12, backgroundColor: "#111111" },
  imageHint: { color: "#FFB5B5", fontSize: 12, lineHeight: 18, marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 5 },
  cancelButton: { padding: 12 },
  cancelText: { color: "#AAAAAA", fontWeight: "bold" },
  saveButton: { minWidth: 112, alignItems: "center", backgroundColor: "#E50914", padding: 12, borderRadius: 7 },
  confirmDeleteButton: { minWidth: 90, alignItems: "center", backgroundColor: "#B00020", padding: 12, borderRadius: 7 },
  saveButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  confirmText: { color: "#DDDDDD", lineHeight: 21, marginBottom: 10 },
});
