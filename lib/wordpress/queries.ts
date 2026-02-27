import { cacheLife, cacheTag } from 'next/cache';
import { fetchFromWordPress } from './client';
import { Post, Page, PostsConnection, RestPost, RestPage, RestSettings } from './types';

/**
 * Transform REST API post to internal Post type
 */
function transformPost(restPost: RestPost): Post {
  const featuredMedia = restPost._embedded?.['wp:featuredmedia']?.[0];
  const author = restPost._embedded?.['author']?.[0];
  const categories = restPost._embedded?.['wp:term']?.[0] || [];
  const tags = restPost._embedded?.['wp:term']?.[1] || [];

  return {
    id: `post-${restPost.id}`,
    databaseId: restPost.id,
    title: restPost.title.rendered,
    slug: restPost.slug,
    content: restPost.content.rendered,
    excerpt: restPost.excerpt.rendered,
    date: restPost.date,
    modified: restPost.modified,
    featuredImage: featuredMedia
      ? {
          node: {
            sourceUrl: featuredMedia.source_url,
            altText: featuredMedia.alt_text,
            mediaDetails: featuredMedia.media_details,
          },
        }
      : undefined,
    author: author
      ? {
          node: {
            name: author.name,
            avatar: author.avatar_urls?.['96']
              ? { url: author.avatar_urls['96'] }
              : undefined,
          },
        }
      : undefined,
    categories: categories.length > 0
      ? {
          nodes: categories.map((cat) => ({
            id: `term-${cat.id}`,
            name: cat.name,
            slug: cat.slug,
          })),
        }
      : undefined,
    tags: tags.length > 0
      ? {
          nodes: tags.map((tag) => ({
            id: `term-${tag.id}`,
            name: tag.name,
            slug: tag.slug,
          })),
        }
      : undefined,
  };
}

/**
 * Transform REST API page to internal Page type
 */
function transformPage(restPage: RestPage): Page {
  const featuredMedia = restPage._embedded?.['wp:featuredmedia']?.[0];

  return {
    id: `page-${restPage.id}`,
    databaseId: restPage.id,
    title: restPage.title.rendered,
    slug: restPage.slug,
    content: restPage.content.rendered,
    date: restPage.date,
    modified: restPage.modified,
    featuredImage: featuredMedia
      ? {
          node: {
            sourceUrl: featuredMedia.source_url,
            altText: featuredMedia.alt_text,
            mediaDetails: featuredMedia.media_details,
          },
        }
      : undefined,
  };
}

/**
 * Generate surrogate keys from a Post (matches WordPress plugin pattern)
 */
function generatePostSurrogateKeys(post: Post): string[] {
  const keys: string[] = [];

  keys.push(`post-${post.databaseId}`);
  keys.push(`post-${post.slug}`);
  keys.push('post-list');

  // Add category term keys
  if (post.categories?.nodes) {
    post.categories.nodes.forEach((category) => {
      const numericId = category.id.replace('term-', '');
      keys.push(`term-${numericId}`);
    });
  }

  // Add tag term keys
  if (post.tags?.nodes) {
    post.tags.nodes.forEach((tag) => {
      const numericId = tag.id.replace('term-', '');
      keys.push(`term-${numericId}`);
    });
  }

  return [...new Set(keys)];
}

/**
 * Generate surrogate keys from a Page
 */
function generatePageSurrogateKeys(page: Page): string[] {
  const keys: string[] = [];

  keys.push(`page-${page.databaseId}`);
  keys.push(`page-${page.slug}`);
  keys.push('page-list');

  return [...new Set(keys)];
}

// ============================================================================
// LOW-LEVEL FETCH FUNCTIONS
// ============================================================================

async function fetchAllPostSlugs(): Promise<{ slugs: string[]; surrogateKeys: string[] }> {
  const posts = await fetchFromWordPress<RestPost[]>(
    '/posts?per_page=100&status=publish&_fields=slug',
    { tags: ['post-list'] }
  );

  const slugs = posts.map((post) => post.slug);
  return { slugs, surrogateKeys: ['post-list'] };
}

async function fetchAllPageSlugs(): Promise<{ slugs: string[]; surrogateKeys: string[] }> {
  const pages = await fetchFromWordPress<RestPage[]>(
    '/pages?per_page=100&status=publish&_fields=slug',
    { tags: ['page-list'] }
  );

  const slugs = pages.map((page) => page.slug);
  return { slugs, surrogateKeys: ['page-list'] };
}

async function fetchSinglePost(slug: string): Promise<{ post: Post | null; surrogateKeys: string[] }> {
  const posts = await fetchFromWordPress<RestPost[]>(
    `/posts?_embed&slug=${encodeURIComponent(slug)}&status=publish`,
    { tags: [`post-${slug}`, 'post-list'] }
  );

  if (!posts || posts.length === 0) {
    return { post: null, surrogateKeys: [`post-${slug}`] };
  }

  const post = transformPost(posts[0]);
  const surrogateKeys = generatePostSurrogateKeys(post);

  return { post, surrogateKeys };
}

async function fetchSinglePage(slug: string): Promise<{ page: Page | null; surrogateKeys: string[] }> {
  const pages = await fetchFromWordPress<RestPage[]>(
    `/pages?_embed&slug=${encodeURIComponent(slug)}&status=publish`,
    { tags: [`page-${slug}`, 'page-list'] }
  );

  if (!pages || pages.length === 0) {
    return { page: null, surrogateKeys: [`page-${slug}`] };
  }

  const page = transformPage(pages[0]);
  const surrogateKeys = generatePageSurrogateKeys(page);

  return { page, surrogateKeys };
}

async function fetchRecentPostsData(
  first: number,
  after?: string
): Promise<{ posts: PostsConnection; surrogateKeys: string[] }> {
  const params = new URLSearchParams({
    _embed: 'true',
    per_page: first.toString(),
    status: 'publish',
    orderby: 'date',
    order: 'desc',
  });

  if (after) {
    params.set('offset', after);
  }

  const restPosts = await fetchFromWordPress<RestPost[]>(
    `/posts?${params.toString()}`,
    { tags: ['post-list'] }
  );

  const posts = restPosts.map(transformPost);
  const allKeys = posts.flatMap((post) => generatePostSurrogateKeys(post));
  const uniqueKeys = [...new Set(allKeys)];

  return {
    posts: {
      nodes: posts,
      pageInfo: {
        hasNextPage: restPosts.length === first,
        endCursor: after ? (parseInt(after) + first).toString() : first.toString(),
      },
    },
    surrogateKeys: uniqueKeys,
  };
}

async function fetchPostsByCategoryData(
  categorySlug: string,
  first: number
): Promise<{ posts: Post[]; surrogateKeys: string[] }> {
  const params = new URLSearchParams({
    _embed: 'true',
    per_page: first.toString(),
    status: 'publish',
    category_name: categorySlug,
  });

  const restPosts = await fetchFromWordPress<RestPost[]>(
    `/posts?${params.toString()}`,
    { tags: [`category-${categorySlug}`, 'post-list'] }
  );

  const posts = restPosts.map(transformPost);
  const allKeys = posts.flatMap((post) => generatePostSurrogateKeys(post));
  const uniqueKeys = [...new Set(allKeys)];

  return { posts, surrogateKeys: uniqueKeys };
}

async function fetchSiteSettingsData(): Promise<{
  settings: {
    title: string;
    description: string;
    url: string;
    language: string;
  } | null;
  surrogateKeys: string[];
}> {
  try {
    // Note: Settings endpoint might require authentication
    // Fall back to null if unavailable
    const settings = await fetchFromWordPress<RestSettings>(
      '/',
      { tags: ['settings'] }
    );

    return {
      settings: {
        title: settings.title,
        description: settings.description,
        url: settings.url,
        language: settings.language,
      },
      surrogateKeys: ['settings'],
    };
  } catch (error) {
    console.warn('[fetchSiteSettings] Settings endpoint unavailable:', error);
    return { settings: null, surrogateKeys: ['settings'] };
  }
}

// ============================================================================
// CACHED WRAPPER FUNCTIONS WITH 'use cache'
// ============================================================================

export async function getAllPostSlugs(): Promise<string[]> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { slugs, surrogateKeys } = await fetchAllPostSlugs();
    surrogateKeys.forEach((key) => cacheTag(key));
    return slugs;
  } catch (error) {
    console.warn('Unable to fetch post slugs at build time, will use ISR:', error);
    return [];
  }
}

export async function getAllPageSlugs(): Promise<string[]> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { slugs, surrogateKeys } = await fetchAllPageSlugs();
    surrogateKeys.forEach((key) => cacheTag(key));
    return slugs;
  } catch (error) {
    console.warn('Unable to fetch page slugs at build time, will use ISR:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { post, surrogateKeys } = await fetchSinglePost(slug);
    surrogateKeys.forEach((key) => cacheTag(key));
    return post;
  } catch (error) {
    console.warn(`Unable to fetch post with slug "${slug}":`, error);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { page, surrogateKeys } = await fetchSinglePage(slug);
    surrogateKeys.forEach((key) => cacheTag(key));
    return page;
  } catch (error) {
    console.warn(`Unable to fetch page with slug "${slug}":`, error);
    return null;
  }
}

export async function getRecentPosts(first: number = 10, after?: string): Promise<PostsConnection> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { posts, surrogateKeys } = await fetchRecentPostsData(first, after);
    surrogateKeys.forEach((key) => cacheTag(key));
    return posts;
  } catch (error) {
    console.warn('Unable to fetch recent posts:', error);
    return {
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    };
  }
}

export async function getPostsByCategory(categorySlug: string, first: number = 10): Promise<Post[]> {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { posts, surrogateKeys } = await fetchPostsByCategoryData(categorySlug, first);
    surrogateKeys.forEach((key) => cacheTag(key));
    return posts;
  } catch (error) {
    console.warn(`Unable to fetch posts for category "${categorySlug}":`, error);
    return [];
  }
}

export async function getSiteSettings() {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });

  try {
    const { settings, surrogateKeys } = await fetchSiteSettingsData();
    surrogateKeys.forEach((key) => cacheTag(key));
    return settings;
  } catch (error) {
    console.warn('Unable to fetch site settings:', error);
    return null;
  }
}
