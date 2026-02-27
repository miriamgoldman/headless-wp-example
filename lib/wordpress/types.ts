/**
 * WordPress REST API Response Types
 */

// Featured Image type (for component compatibility)
export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText: string;
    mediaDetails?: {
      width: number;
      height: number;
    };
  };
}

// REST API embedded media
export interface RestEmbeddedMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
  };
}

// REST API embedded author
export interface RestEmbeddedAuthor {
  id: number;
  name: string;
  avatar_urls?: {
    [size: string]: string;
  };
}

// REST API embedded term (category/tag)
export interface RestEmbeddedTerm {
  id: number;
  name: string;
  slug: string;
}

// REST API post response
export interface RestPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: RestEmbeddedMedia[];
    'author'?: RestEmbeddedAuthor[];
    'wp:term'?: RestEmbeddedTerm[][];
  };
}

// REST API page response
export interface RestPage {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  parent: number;
  _embedded?: {
    'wp:featuredmedia'?: RestEmbeddedMedia[];
  };
}

// REST API settings response
export interface RestSettings {
  title: string;
  description: string;
  url: string;
  language: string;
}

// Transformed post (matches your current structure)
export interface Post {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  date: string;
  modified: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
  };
  author?: {
    node: {
      name: string;
      avatar?: {
        url: string;
      };
    };
  };
  categories?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
  tags?: {
    nodes: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

// Transformed page (matches your current structure)
export interface Page {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
  };
  parent?: {
    node: {
      slug: string;
    };
  };
}

export interface PostsConnection {
  nodes: Post[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}
