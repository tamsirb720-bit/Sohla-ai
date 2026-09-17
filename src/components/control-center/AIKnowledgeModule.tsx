import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { AIKnowledgeEntry } from '../../types';

interface AIKnowledgeModuleProps {
  currentAdminName: string;
}

export const AIKnowledgeModule: React.FC<AIKnowledgeModuleProps> = ({ currentAdminName }) => {
  const [entries, setEntries] = useState<AIKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AIKnowledgeEntry | null>(null);

  const [formData, setFormData] = useState<Partial<AIKnowledgeEntry>>({
    title: '',
    category: 'National Holidays & Special Hours',
    content: '',
    active: true,
    priority: 1
  });

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/control-center/ai-knowledge');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load AI knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      if (isCreating) {
        await fetch('/api/control-center/ai-knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, _adminName: currentAdminName })
        });
        setActionMessage('Added new knowledge entry');
      } else if (editingEntry) {
        await fetch(`/api/control-center/ai-knowledge/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, _adminName: currentAdminName })
        });
        setActionMessage('Updated knowledge entry');
      }
      setIsCreating(false);
      setEditingEntry(null);
      setFormData({
        title: '',
        category: 'National Holidays & Special Hours',
        content: '',
        active: true,
        priority: 1
      });
      setTimeout(() => setActionMessage(null), 3000);
      fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (entry: AIKnowledgeEntry) => {
    try {
      await fetch(`/api/control-center/ai-knowledge/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !entry.active, _adminName: currentAdminName })
      });
      fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (entry: AIKnowledgeEntry) => {
    if (!window.confirm(`Delete entry "${entry.title}"?`)) return;
    try {
      await fetch(`/api/control-center/ai-knowledge/${entry.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Knowledge & Platform Announcements
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Inject official local notices, holiday schedules, and ferry updates safely into SOHLA AI grounding
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setFormData({
              title: '',
              category: 'Holiday Schedule',
              content: '',
              active: true,
              priority: 1
            });
            setIsCreating(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Knowledge Entry
        </button>
      </div>

      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Strict Grounding Preservation</div>
          <div className="mt-0.5 text-blue-800">
            Entries marked active are appended directly to the AI's verified database context. The core Gambian persona and zero-hallucination rules remain strictly preserved.
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#EADBCA] p-10 text-center text-stone-400">
            No custom AI knowledge entries registered. Click "Add Knowledge Entry" to create notices.
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                entry.active ? 'border-[#EADBCA]' : 'border-stone-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {entry.category}
                  </span>
                  <button
                    onClick={() => handleToggleActive(entry)}
                    className="flex items-center gap-1 font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {entry.active ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <ToggleRight className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="text-stone-400 flex items-center gap-1">
                        <ToggleLeft className="w-4 h-4" /> Disabled
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-stone-900 text-sm">{entry.title}</h3>
                <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-3 rounded-lg border border-stone-100 whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>By {entry.author}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingEntry(entry);
                      setFormData(entry);
                      setIsCreating(false);
                    }}
                    className="p-1 text-stone-600 hover:text-stone-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {(isCreating || editingEntry) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">
                {isCreating ? 'Add Knowledge Entry' : `Edit ${editingEntry?.title}`}
              </h3>
              <button onClick={() => { setIsCreating(false); setEditingEntry(null); }}>
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Notice / Topic Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                  placeholder="e.g., Ramadan Evening Delivery Extended Hours"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Knowledge Content (Factual statement for SOHLA AI) *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                  placeholder="e.g., During the holy month of Ramadan, participating Gambian restaurants provide Iftar delivery until 23:30 across Senegambia, Kololi, and Fajara."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-amber-600"
                />
                <span className="font-semibold text-stone-800">Immediately Active in AI Responses</span>
              </label>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingEntry(null); }}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 text-stone-950 font-semibold rounded-lg"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
