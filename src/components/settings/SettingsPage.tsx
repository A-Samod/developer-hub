'use client';

import { useMemo, useState } from 'react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import ConfirmBanner from '@/components/ui/ConfirmBanner';
import { useHub } from '@/lib/hub/HubProvider';
import type { CategoryEntityType } from '@/types/models';

const entityTypes: CategoryEntityType[] = ['note', 'snippet', 'task'];

export default function SettingsPage() {
  const hub = useHub();
  const [entityType, setEntityType] = useState<CategoryEntityType>('note');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const grouped = useMemo(() => {
    return entityTypes.map((type) => ({
      type,
      items: hub.state.categories.filter((c) => c.entity_type === type),
    }));
  }, [hub.state.categories]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await hub.createCategory({ name: name.trim(), entity_type: entityType, color });
    setName('');
    setMessage('Category added');
  }

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    await hub.updateCategory(id, { name: editName.trim() });
    setEditingId(null);
    setMessage('Category renamed');
  }

  function downloadExport() {
    const blob = new Blob([hub.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-hub-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Export downloaded');
  }

  async function seedDefaultsConfirmed() {
    await hub.seedCategoriesIfEmpty();
    setConfirmSeed(false);
    setMessage('Default categories seeded (skipped if you already have some)');
  }

  async function removeCategoryConfirmed() {
    if (!deleteCategory) return;
    await hub.deleteCategory(deleteCategory.id);
    setDeleteCategory(null);
    setEditingId(null);
    setMessage('Category removed');
  }

  if (hub.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading settings…</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Categories, theme, and data export
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-md bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {message}
        </div>
      )}

      {confirmSeed && (
        <ConfirmBanner
          title="Seed default categories?"
          message="Adds starter categories only if your account has none yet."
          confirmLabel="Seed categories"
          onConfirm={() => void seedDefaultsConfirmed()}
          onCancel={() => setConfirmSeed(false)}
        />
      )}

      {deleteCategory && (
        <ConfirmBanner
          danger
          title={`Remove “${deleteCategory.name}”?`}
          message="Items using this category keep their content; the category link is cleared."
          confirmLabel="Remove category"
          onConfirm={() => void removeCategoryConfirmed()}
          onCancel={() => setDeleteCategory(null)}
        />
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Categories
        </h2>
        <form onSubmit={addCategory} className="panel mb-4 flex flex-wrap gap-2 p-3">
          <select
            className="input max-w-[140px]"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as CategoryEntityType)}
          >
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="input max-w-xs"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="color"
            className="h-10 w-12 rounded border border-[var(--color-border)]"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>

        <div className="grid gap-4 lg:grid-cols-3">
          {grouped.map((group) => (
            <div key={group.type} className="panel">
              <div className="border-b border-[var(--color-border)] px-3 py-2 text-sm font-semibold capitalize">
                {group.type}
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {group.items.map((cat) => (
                  <li key={cat.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: cat.color }}
                    />
                    {editingId === cat.id ? (
                      <>
                        <input
                          className="input min-w-0 flex-1"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-primary shrink-0"
                          onClick={() => void saveRename(cat.id)}
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
                        <span className="min-w-0 flex-1">{cat.name}</span>
                        <button
                          type="button"
                          className="btn-secondary shrink-0"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="btn-danger shrink-0"
                          onClick={() => setDeleteCategory({ id: cat.id, name: cat.name })}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Appearance
        </h2>
        <div className="panel space-y-3 p-4">
          <p className="text-sm text-[var(--color-muted)]">
            Theme preference is saved in this browser.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-[var(--color-ink)]">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Data
        </h2>
        <div className="panel flex flex-wrap gap-2 p-4">
          <button type="button" className="btn-secondary" onClick={downloadExport}>
            Export JSON
          </button>
          <button type="button" className="btn-secondary" onClick={() => setConfirmSeed(true)}>
            Seed default categories
          </button>
        </div>
      </section>
    </div>
  );
}
