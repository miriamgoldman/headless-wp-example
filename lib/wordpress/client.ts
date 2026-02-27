/**
 * WordPress REST API Client
 * Simple fetch wrapper for WordPress REST API v2
 */

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || '';

interface FetchOptions {
  tags?: string[];
}

/**
 * Fetch from WordPress REST API
 */
export async function fetchFromWordPress<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  if (!WORDPRESS_API_URL) {
    throw new Error('WORDPRESS_API_URL environment variable is not set');
  }

  // Build full URL
  const url = `${WORDPRESS_API_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
    },
  };

  // Add cache tags if provided
  if (options.tags && options.tags.length > 0) {
    fetchOptions.next = { tags: options.tags };
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `REST API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Error fetching from WordPress:', error);
    throw error;
  }
}
