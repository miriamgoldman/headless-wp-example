import { Post, Page } from '@/lib/wordpress/types';
import FeaturedImage from './FeaturedImage';

interface PageContentProps {
  content: Post | Page;
  showMeta?: boolean;
}

export default function PageContent({ content, showMeta = true }: PageContentProps) {
  const formattedDate = new Date(content.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPost = 'author' in content;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{content.title}</h1>

        {showMeta && (
          <div className="flex items-center space-x-4 text-gray-600">
            {isPost && content.author && (
              <span className="font-medium">{content.author.node.name}</span>
            )}
            <time dateTime={content.date}>{formattedDate}</time>
          </div>
        )}

        {isPost && content.categories && content.categories.nodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {content.categories.nodes.map((category) => (
              <span
                key={category.id}
                className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {content.featuredImage && (
        <FeaturedImage
          image={content.featuredImage}
          className="h-96 w-full rounded-lg mb-8"
          priority
        />
      )}

      <div className="wp-content" dangerouslySetInnerHTML={{ __html: content.content }} />

      {isPost && content.tags && content.tags.nodes.length > 0 && (
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {content.tags.nodes.map((tag) => (
              <span
                key={tag.id}
                className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
