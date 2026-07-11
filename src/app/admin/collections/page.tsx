"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Trash2, Edit, Check, X } from 'lucide-react';
import { updateCollection } from '@/actions/admin';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollection, setNewCollection] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', slug: '', is_active: true });
  const supabase = createClient();

  const fetchCollections = async () => {
    const { data } = await supabase.from('collections').select('*').order('title');
    if (data) setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollection.trim()) return;
    const slug = newCollection.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('collections').insert({ title: newCollection, slug });
    if (!error) {
      setNewCollection('');
      fetchCollections();
    } else {
      alert(error.message);
    }
  };

  const startEdit = (col: any) => {
    setEditingId(col.id);
    setEditForm({ title: col.title, slug: col.slug, is_active: !!col.is_active });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateCollection(id, editForm);
      setEditingId(null);
      fetchCollections();
    } catch (err: any) {
      alert(err?.message || 'Failed to update collection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    await supabase.from('collections').delete().eq('id', id);
    fetchCollections();
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between border-b-2 border-[var(--charcoal-ink)]/20 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)]">Marketing Collections</h1>
          <p className="font-sans text-sm opacity-70 mt-1 uppercase tracking-widest">Manage curated thematic groups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleAddCollection} className="bg-[var(--unbleached-cotton)] border-4 border-double border-[var(--charcoal-ink)] p-6 shadow-[4px_4px_0_var(--charcoal-ink)]">
            <h2 className="font-serif text-xl font-bold mb-4">Add Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--indigo-dye)] mb-1">Collection Title</label>
                <input
                  type="text"
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  className="w-full border-2 border-[var(--charcoal-ink)]/20 bg-transparent p-2 focus:outline-none focus:border-[var(--madder-red)]"
                  placeholder="e.g. Summer Edit"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[var(--charcoal-ink)] text-white hover:bg-[var(--turmeric)] hover:text-[var(--charcoal-ink)] uppercase tracking-widest text-xs font-bold py-3">
                Create Collection
              </Button>
            </div>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="hidden md:block bg-white border-2 border-[var(--charcoal-ink)] p-6 shadow-[4px_4px_0_var(--charcoal-ink)] overflow-x-auto">
            {loading ? (
              <p className="opacity-50">Loading collections...</p>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-[var(--charcoal-ink)]">
                    <th className="pb-3 text-xs uppercase tracking-widest font-bold">Title</th>
                    <th className="pb-3 text-xs uppercase tracking-widest font-bold">Slug</th>
                    <th className="pb-3 text-xs uppercase tracking-widest font-bold">Status</th>
                    <th className="pb-3 text-xs uppercase tracking-widest font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col) => {
                    const isEditing = editingId === col.id;
                    return (
                      <tr key={col.id} className="border-b border-[var(--charcoal-ink)]/10 last:border-0 hover:bg-[var(--unbleached-cotton)]/50 transition-colors">
                        <td className="py-4">
                          {isEditing ? (
                            <input 
                              value={editForm.title}
                              onChange={e => setEditForm({...editForm, title: e.target.value})}
                              className="border border-[var(--charcoal-ink)]/20 p-1 w-full text-sm"
                            />
                          ) : (
                            <span className="font-bold">{col.title}</span>
                          )}
                        </td>
                        <td className="py-4 opacity-70 font-mono text-xs">
                          {isEditing ? (
                            <input 
                              value={editForm.slug}
                              onChange={e => setEditForm({...editForm, slug: e.target.value})}
                              className="border border-[var(--charcoal-ink)]/20 p-1 w-full text-sm"
                            />
                          ) : (
                            col.slug
                          )}
                        </td>
                        <td className="py-4">
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-xs">
                              <input 
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                              />
                              Active
                            </label>
                          ) : (
                            <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest border-2 ${col.is_active ? 'border-green-600 text-green-700 bg-green-50' : 'border-gray-400 text-gray-500 bg-gray-50'}`}>
                              {col.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(col.id)} className="p-2 border-2 border-green-600 text-green-700 hover:bg-green-50"><Check size={14}/></button>
                              <button onClick={() => setEditingId(null)} className="p-2 border-2 border-gray-400 text-gray-600 hover:bg-gray-50"><X size={14}/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(col)} className="p-2 border-2 border-[var(--charcoal-ink)] hover:bg-[var(--charcoal-ink)] hover:text-white transition-colors"><Edit size={14} /></button>
                              <button onClick={() => handleDelete(col.id)} className="p-2 border-2 border-[var(--madder-red)] text-[var(--madder-red)] hover:bg-[var(--madder-red)] hover:text-white transition-colors"><Trash2 size={14} /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {collections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center opacity-50">No collections found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
