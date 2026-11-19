// Shared MockAPI helpers for favorites and movie reviews.
export const API_URL =
  "https://6af3f9fe55a1de7dcf03745a.mockapi.io/api/products/items";

export const USER_ID = "jadedadang";
export const USER_NAME = "Jade Dadang";
export const USER_AVATAR_URL =
  "https://i.pinimg.com/736x/bd/b7/06/bdb706a2bcf2b922a9a2cf8110d4ee4d.jpg";
export type ReviewReaction = "like" | "love" | "popcorn";
export type ReviewReactions = Record<ReviewReaction, string[]>;

export type ReviewComment = {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type FavoriteMovie = {
  id: string;
  title: string;
  category?: string;
  image: string;
  userId: string;
  movieId?: string;
  recordType?: "favorite" | "review";
};

export type ReviewPost = {
  id: string;
  recordType: "review";
  movieTitle: string;
  rating: number;
  reviewText: string;
  imageUrl?: string;
  reactions?: ReviewReactions;
  comments?: ReviewComment[];
  userId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
};

export async function getFavorites(): Promise<FavoriteMovie[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Could not load favorites.");
  const data: FavoriteMovie[] = await response.json();
  return data.filter((item) => item.userId === USER_ID && item.recordType !== "review");
}

export async function addFavorite(movie: {
  id: string;
  title: string;
  category?: string;
  image: string;
}): Promise<FavoriteMovie> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      movieId: movie.id,
      title: movie.title,
      category: movie.category ?? "Movie",
      image: movie.image,
      userId: USER_ID,
      recordType: "favorite",
    }),
  });
  if (!response.ok) throw new Error("Could not save this movie.");
  return response.json();
}

export async function updateFavorite(
  favorite: FavoriteMovie,
  changes: Pick<FavoriteMovie, "title" | "category">
): Promise<FavoriteMovie> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(favorite.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...favorite, ...changes }),
  });
  if (!response.ok) throw new Error("Could not update this favorite.");
  return response.json();
}

export async function removeFavorite(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not remove this favorite.");
}

export async function getReviewPosts(): Promise<ReviewPost[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Could not load movie reviews.");
  const data: ReviewPost[] = await response.json();
  return data
    .filter((item) => item.recordType === "review")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLikedReviewPosts(): Promise<ReviewPost[]> {
  const posts = await getReviewPosts();
  return posts.filter((post) =>
    (Object.keys(post.reactions ?? {}) as ReviewReaction[]).some((reaction) =>
      post.reactions?.[reaction]?.includes(USER_ID)
    )
  );
}

export function getUserReaction(post: ReviewPost, userId = USER_ID): ReviewReaction | undefined {
  return (Object.keys(post.reactions ?? {}) as ReviewReaction[]).find((reaction) =>
    post.reactions?.[reaction]?.includes(userId)
  );
}

export async function addReviewPost(
  post: Pick<ReviewPost, "movieTitle" | "rating" | "reviewText"> & { imageUrl: string }
): Promise<ReviewPost> {
  const now = new Date().toISOString();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...post,
      recordType: "review",
      userId: USER_ID,
      authorName: USER_NAME,
      createdAt: now,
      reactions: { like: [], love: [], popcorn: [] },
    }),
  });
  if (!response.ok) throw new Error("Could not publish this review.");
  return response.json();
}

export async function updateReviewPost(
  post: ReviewPost,
  changes: Pick<ReviewPost, "movieTitle" | "rating" | "reviewText"> & { imageUrl: string }
): Promise<ReviewPost> {
  return saveReviewPost({
    ...post,
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateReviewReaction(
  post: ReviewPost,
  reaction: ReviewReaction | null
): Promise<ReviewPost> {
  const reactions: ReviewReactions = {
    like: [...(post.reactions?.like ?? [])],
    love: [...(post.reactions?.love ?? [])],
    popcorn: [...(post.reactions?.popcorn ?? [])],
  };
  const currentReaction = (Object.keys(reactions) as ReviewReaction[]).find((key) =>
    reactions[key].includes(USER_ID)
  );

  if ((!currentReaction && reaction === null) || currentReaction === reaction) return post;

  for (const key of Object.keys(reactions) as ReviewReaction[]) {
    reactions[key] = reactions[key].filter((userId) => userId !== USER_ID);
  }
  if (reaction) reactions[reaction] = [...reactions[reaction], USER_ID];

  return saveReviewPost({ ...post, reactions });
}

export async function addReviewComment(post: ReviewPost, text: string): Promise<ReviewPost> {
  const comment: ReviewComment = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    userId: USER_ID,
    authorName: USER_NAME,
    text,
    createdAt: new Date().toISOString(),
  };
  return saveReviewPost({
    ...post,
    comments: [...(post.comments ?? []), comment],
  });
}

async function saveReviewPost(post: ReviewPost): Promise<ReviewPost> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(post.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error("Could not update this review.");
  return response.json();
}

export async function removeReviewPost(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not delete this review.");
}
