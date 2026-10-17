'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/layout/ThemeToggle';
import ColorSwatchPicker from '@/components/ui/ColorSwatchPicker';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import RowOverflowMenu from '@/components/ui/RowOverflowMenu';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';
import { todayDate } from '@/lib/dates';
import { useHub } from '@/lib/hub/HubProvider';
import { createClient } from '@/lib/supabase/client';
import { toastError, toastSuccess } from '@/lib/toast';
import type { CategoryEntityType } from '@/types/models';

const entityTypes: CategoryEntityType[] = ['note', 'snippet', 'task'];
const entityLabels: Record<CategoryEntityType, string> = {
  note: 'Notes',
  snippet: 'Snippets',
  task: 'Tasks',
};

export default function SettingsPage() {
  const hub = useHub();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entityType, setEntityType] = useState<CategoryEntityType>('note');
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<{
    id: string;
    name: string;
    count: number;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'skip' | 'replace' | 'keep_both'>('skip');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
    });
  }, []);

  const categoriesForType = useMemo(
    () => hub.state.categories.filter((c) => c.entity_type === entityType),
    [hub.state.categories, entityType],
  );

  function itemCountForCategory(id: string, type: CategoryEntityType) {
    if (type === 'note') return hub.state.notes.filter((n) => n.category_id === id).length;
    if (type === 'snippet') return hub.state.snippets.filter((n) => n.category_id === id).length;
    return hub.state.tasks.filter((n) => n.category_id === id).length;
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await hub.createCategory({ name: name.trim(), entity_type: entityType, color });
    setName('');
    toastSuccess('Category added');
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await hub.updateCategory(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
    toastSuccess('Category updated');
  }

  function downloadExport() {
    const blob = new Blob([hub.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-hub-export-${todayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Export downloaded');
  }

  async function onImportFile(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      const result = await hub.importJson(payload, { onDuplicate: importStrategy });
      toastSuccess(
        `Import done: ${result.created} created, ${result.replaced} replaced, ${result.skipped} skipped`,
      );
      if (result.errors.length) {
        toastError(result.errors.slice(0, 2).join('; '));
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function seedDefaultsConfirmed() {
    await hub.seedCategoriesIfEmpty();
    setConfirmSeed(false);
    toastSuccess('Default categories added (existing ones kept)');
  }

  async function removeCategoryConfirmed() {
    if (!deleteCategory) return;
    await hub.deleteCategory(deleteCategory.id);
    setDeleteCategory(null);
    setEditingId(null);
    toastSuccess('Category removed');
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setConfirmSignOut(false);
    router.push('/login');
    router.refresh();
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Categories, appearance, data and account.
        </p>
      </div>

      {confirmSeed && (
        <ConfirmBanner
          title="Add default categories?"
          message="Adds any missing starter categories. Existing ones are never duplicated."
          confirmLabel="Add"
          onConfirm={() => void seedDefaultsConfirmed()}
          onCancel={() => setConfirmSeed(false)}
        />
      )}

      {deleteCategory && (
        <ConfirmBanner
          danger
          title={`Remove “${deleteCategory.name}”?`}
          message={
            deleteCategory.count > 0
              ? `Used by ${deleteCategory.count} item${deleteCategory.count === 1 ? '' : 's'}. Items keep their content; the category link is cleared.`
              : 'No items use this category. This cannot be undone from here.'
          }
          confirmLabel="Remove category"
          onConfirm={() => void removeCategoryConfirmed()}
          onCancel={() => setDeleteCategory(null)}
        />
      )}

      {confirmSignOut && (
        <ConfirmBanner
          title="Sign out?"
          message="You'll need to sign in again to access Developer Hub."
          confirmLabel="Sign out"
          onConfirm={() => void signOut()}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Categories
          </h2>
          <span className="text-sm text-[var(--color-muted)]">
            {categoriesForType.length} categor{categoriesForType.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        <div className="mb-3 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-chip)] p-1">
          {entityTypes.map((t) => (
            <button
              key={t}
              type="button"
              className={`min-h-9 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                entityType === t
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
              onClick={() => setEntityType(t)}
            >
              {entityLabels[t]}
            </button>
          ))}
        </div>

        <form onSubmit={addCategory} className="panel mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            className="input max-w-xs flex-1"
            placeholder={`New ${entityType} category`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ColorSwatchPicker value={color} onChange={setColor} />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>

        <ul className="panel divide-y divide-[var(--color-border)]">
          {categoriesForType.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--color-muted)]">No categories yet.</li>
          ) : (
            categoriesForType.map((cat) => {
              const count = itemCountForCategory(cat.id, entityType);
              return (
                <li key={cat.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  {editingId === cat.id ? (
                    <>
                      <ColorSwatchPicker value={editColor} onChange={setEditColor} size="sm" />
                      <input
                        className="input min-w-0 flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-primary shrink-0"
                        onClick={() => void saveEdit(cat.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary shrink-0"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="h-8 w-8 shrink-0 rounded-lg"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {count} item{count === 1 ? '' : 's'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary shrink-0"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditColor(cat.color);
                        }}
                      >
                        Edit
                      </button>
                      <RowOverflowMenu
                        items={[
                          {
                            label: 'Remove…',
                            danger: true,
                            onClick: () =>
                              setDeleteCategory({ id: cat.id, name: cat.name, count }),
                          },
                        ]}
                      />
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Appearance
        </h2>
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <p className="text-sm text-[var(--color-muted)]">Saved in this browser</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Data
        </h2>
        <ul className="panel divide-y divide-[var(--color-border)]">
          <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Export JSON</div>
              <p className="text-sm text-[var(--color-muted)]">
                Download all notes, snippets, tasks and categories as a backup.
              </p>
            </div>
            <button type="button" className="btn-secondary shrink-0" onClick={downloadExport}>
              Export
            </button>
          </li>
          <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Import JSON</div>
              <p className="text-sm text-[var(--color-muted)]">
                Restore from a backup. Existing items are kept; you choose how to handle duplicates.
              </p>
              <select
                className="input mt-2 max-w-xs"
                value={importStrategy}
                onChange={(e) =>
                  setImportStrategy(e.target.value as 'skip' | 'replace' | 'keep_both')
                }
                aria-label="Duplicate strategy"
              >
                <option value="skip">Duplicates: skip</option>
                <option value="replace">Duplicates: replace</option>
                <option value="keep_both">Duplicates: keep both</option>
              </select>
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onImportFile(file);
                }}
              />
              <button
                type="button"
                className="btn-secondary shrink-0"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </li>
          <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Add default categories</div>
              <p className="text-sm text-[var(--color-muted)]">
                Adds any missing starter categories. Existing ones are never duplicated.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setConfirmSeed(true)}
            >
              Add
            </button>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Account
        </h2>
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="truncate text-sm">{email || '—'}</div>
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => setConfirmSignOut(true)}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
