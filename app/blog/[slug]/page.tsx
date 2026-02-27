import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPostSlugs, getPostBySlug } from '@/lib/wordpress/queries';
import PageContent from '@/components/wordpress/PageContent';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs();

    // Next.js 16 Cache Components requires at least one entry
    if (slugs.length === 0) {
      return [{ slug: 'placeholder' }];
    }

    return slugs.map((slug) => ({
      slug,
    }));
  } catch (error) {
    console.warn('[generateStaticParams] WordPress unavailable, using placeholder');
    return [{ slug: 'placeholder' }];
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const excerpt = post.excerpt?.replace(/<[^>]*>/g, '') || '';

  return {
    title: post.title,
    description: excerpt.slice(0, 160),
    openGraph: {
      title: post.title,
      description: excerpt.slice(0, 160),
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: post.featuredImage
        ? [
            {
              url: post.featuredImage.node.sourceUrl,
              alt: post.featuredImage.node.altText || post.title,
            },
          ]
        : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-white">
      <PageContent content={post} showMeta={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to blog
        </Link>
      </div>
    </div>
  );
}
