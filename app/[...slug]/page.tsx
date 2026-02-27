import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPageSlugs, getPageBySlug } from '@/lib/wordpress/queries';
import PageContent from '@/components/wordpress/PageContent';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPageSlugs();

    // Next.js 16 Cache Components requires at least one entry
    if (slugs.length === 0) {
      return [{ slug: ['placeholder'] }];
    }

    return slugs.map((slug) => ({
      slug: [slug],
    }));
  } catch (error) {
    console.warn('[generateStaticParams] WordPress unavailable, using placeholder');
    return [{ slug: ['placeholder'] }];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageSlug = slug.join('/');
  const page = await getPageBySlug(pageSlug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.title,
    description: page.content.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: page.title,
      type: 'website',
      images: page.featuredImage
        ? [
            {
              url: page.featuredImage.node.sourceUrl,
              alt: page.featuredImage.node.altText || page.title,
            },
          ]
        : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const pageSlug = slug.join('/');
  const page = await getPageBySlug(pageSlug);

  if (!page) {
    notFound();
  }

  return (
    <div className="bg-white">
      <PageContent content={page} showMeta={false} />
    </div>
  );
}
