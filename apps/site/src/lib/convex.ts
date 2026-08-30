import { ConvexHttpClient } from "convex/browser"
import { anyApi } from "convex/server"

const url =
  import.meta.env.CONVEX_URL ??
  import.meta.env.VITE_CONVEX_URL ??
  "https://peaceful-chipmunk-367.convex.cloud"

export const convex = new ConvexHttpClient(url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api = anyApi as any

export interface ListShare {
  _id: string
  name: string
  description?: string
  itemCount: number
  kind: "liked" | "custom"
  visibility: "public" | "private"
  shortCode?: string
  owner: { username: string; displayName: string; avatarUrl?: string } | null
  previewPosters: string[]
}

export async function getListByShortCode(
  shortCode: string
): Promise<ListShare | null> {
  try {
    return await convex.query(api.lists.byShortCode, { shortCode })
  } catch {
    return null
  }
}

export interface PublicListPreview {
  name: string
  shortCode?: string
  kind: "liked" | "custom"
  itemCount: number
  lastItemAddedAt: number
  previewPosters: string[]
}

export interface PublicProfile {
  username: string
  displayName: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  createdAt: number
  listCount: number
  friendCount: number
  publicLists: PublicListPreview[]
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  try {
    return await convex.query(api.profiles.publicProfileByUsername, {
      username,
    })
  } catch {
    return null
  }
}
