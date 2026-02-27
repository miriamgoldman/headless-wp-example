export const FEATURED_IMAGE_FIELDS = `
  fragment FeaturedImageFields on MediaItem {
    sourceUrl
    altText
    mediaDetails {
      width
      height
    }
  }
`;

export const AUTHOR_FIELDS = `
  fragment AuthorFields on User {
    name
    avatar {
      url
    }
  }
`;

export const POST_FIELDS = `
  fragment PostFields on Post {
    id
    databaseId
    title
    slug
    content
    excerpt
    date
    modified
    featuredImage {
      node {
        ...FeaturedImageFields
      }
    }
    author {
      node {
        ...AuthorFields
      }
    }
    categories {
      nodes {
        id
        name
        slug
      }
    }
    tags {
      nodes {
        id
        name
        slug
      }
    }
  }
  ${FEATURED_IMAGE_FIELDS}
  ${AUTHOR_FIELDS}
`;

export const PAGE_FIELDS = `
  fragment PageFields on Page {
    id
    databaseId
    title
    slug
    content
    date
    modified
    featuredImage {
      node {
        ...FeaturedImageFields
      }
    }
    parent {
      node {
        slug
      }
    }
  }
  ${FEATURED_IMAGE_FIELDS}
`;

export const POST_CARD_FIELDS = `
  fragment PostCardFields on Post {
    id
    databaseId
    title
    slug
    excerpt
    date
    featuredImage {
      node {
        ...FeaturedImageFields
      }
    }
    author {
      node {
        ...AuthorFields
      }
    }
    categories {
      nodes {
        id
        name
        slug
      }
    }
  }
  ${FEATURED_IMAGE_FIELDS}
  ${AUTHOR_FIELDS}
`;
