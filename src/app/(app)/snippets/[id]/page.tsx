import SnippetFormPage from '@/components/snippets/SnippetFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SnippetFormPage snippetId={id} />;
}
