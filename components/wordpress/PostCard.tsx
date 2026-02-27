import Link from 'next/link';
import { Post } from '@/lib/wordpress/types';
import FeaturedImage from './FeaturedImage';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {post.featuredImage && (
        <Link href={`/blog/${post.slug}`}>
          <FeaturedImage image={post.featuredImage} className="h-48 w-full" />
        </Link>
      )}

      <div className="p-6">
        {post.categories && post.categories.nodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.nodes.slice(0, 3).map((category) => (
              <span
                key={category.id}
                className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <div
            className="text-gray-600 mb-4 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: post.excerpt }}
          />
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {post.author && <span>{post.author.node.name}</span>}
          </div>
          <time dateTime={post.date}>{formattedDate}</time>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Read more &rarr;
        </Link>
      </div>
    </article>
  );
}
