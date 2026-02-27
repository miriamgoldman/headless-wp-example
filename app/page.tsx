import Link from 'next/link';
import { getRecentPosts } from '@/lib/wordpress/queries';
import PostCard from '@/components/wordpress/PostCard';

export default async function Home() {
  const { nodes: posts } = await getRecentPosts(3);

  return (
    <div className="bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to WordPress Headless
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            A modern headless WordPress site built with Next.js 16 and powered by WordPress REST API
          </p>
          <Link
            href="/blog"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Explore Blog
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Recent Posts</h2>
          <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
            View all posts &rarr;
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts found. Check your WordPress connection.</p>
          </div>
        )}
      </section>
    </div>
  );
}
