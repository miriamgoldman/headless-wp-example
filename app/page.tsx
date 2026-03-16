import Link from 'next/link';
import { getFrontPage, getRecentPosts } from '@/lib/wordpress/queries';
import PageContent from '@/components/wordpress/PageContent';
import PostCard from '@/components/wordpress/PostCard';

export default async function Home() {
  const frontPage = await getFrontPage();

  if (frontPage) {
    return (
      <div className="bg-white">
        <PageContent content={frontPage} showMeta={false} />
      </div>
    );
  }

  // Fallback: show recent posts if no static front page is set
  const { nodes: posts } = await getRecentPosts(10);

  return (
    <div className="bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recent Posts</h1>
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
