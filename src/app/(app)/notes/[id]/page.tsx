import NoteFormPage from '@/components/notes/NoteFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NoteFormPage noteId={id} />;
}
