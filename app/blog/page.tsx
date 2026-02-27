import { Metadata } from 'next';
import { getRecentPosts } from '@/lib/wordpress/queries';
import PostCard from '@/components/wordpress/PostCard';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest blog posts',
};

export default async function BlogPage() {
  const { nodes: posts, pageInfo } = await getRecentPosts(12);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600">
            Latest articles, updates, and insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pageInfo.hasNextPage && (
              <div className="mt-12 text-center">
                <p className="text-gray-600">
                  More posts available. Pagination coming soon.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No posts found. Make sure your WordPress backend is configured correctly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
