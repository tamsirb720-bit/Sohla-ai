import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Calendar,
  Film,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Save,
  Eye,
  FileCheck
} from 'lucide-react';
import { NewsArticle, PlatformEvent, EntertainmentItem, ContentStatus } from '../../types';

interface ContentModuleProps {
  initialSubTab?: 'news' | 'events' | 'entertainment';
  currentAdminName: string;
}

export const ContentModule: React.FC<ContentModuleProps> = ({
  initialSubTab = 'news',
  currentAdminName
}) => {
  const [activeTab, setActiveTab] = useState<'news' | 'events' | 'entertainment'>(initialSubTab);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [entertainment, setEntertainment] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modals
  const [isCreatingNews, setIsCreatingNews] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingEntertainment, setIsCreatingEntertainment] = useState(false);

  // Form states
  const [newsForm, setNewsForm] = useState<Partial<NewsArticle>>({
    title: '',
    category: 'Commerce & Economy',
    summary: '',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    status: 'draft'
  });

  const [eventForm, setEventForm] = useState<Partial<PlatformEvent>>({
    title: '',
    location: 'Senegambia Strip',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    description: '',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    organizer: 'Local Community Team',
    contact: '+220 700 0000',
    status: 'draft'
  });

  const [entertainmentForm, setEntertainmentForm] = useState<Partial<EntertainmentItem>>({
    title: '',
    category: 'Local Culture',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    description: '',
    status: 'draft'
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      const [nRes, eRes, entRes] = await Promise.all([
        fetch('/api/control-center/news'),
        fetch('/api/control-center/events'),
        fetch('/api/control-center/entertainment')
      ]);
      const [nData, eData, entData] = await Promise.all([
        nRes.json(),
        eRes.json(),
        entRes.json()
      ]);
      setNews(Array.isArray(nData) ? nData : []);
      setEvents(Array.isArray(eData) ? eData : []);
      setEntertainment(Array.isArray(entData) ? entData : []);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/control-center/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newsForm, _adminName: currentAdminName })
      });
      setActionMessage('Article saved successfully');
      setIsCreatingNews(false);
      setNewsForm({
        title: '',
        category: 'Commerce & Economy',
        summary: '',
        content: '',
        coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
        status: 'draft'
      });
      setTimeout(() => setActionMessage(null), 3000);
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/control-center/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, _adminName: currentAdminName })
      });
      setActionMessage('Event published successfully');
      setIsCreatingEvent(false);
      setTimeout(() => setActionMessage(null), 3000);
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEntertainment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/control-center/entertainment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entertainmentForm, _adminName: currentAdminName })
      });
      setActionMessage('Entertainment showcase saved');
      setIsCreatingEntertainment(false);
      setTimeout(() => setActionMessage(null), 3000);
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (type: 'news' | 'events' | 'entertainment', id: string) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await fetch(`/api/control-center/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      fetchContent();
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

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-600" />
            News, Events & Entertainment Center
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage official community editorial, cultural events, and video spotlights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'news'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              News Articles ({news.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('entertainment')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'entertainment'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Spotlights ({entertainment.length})
            </button>
          </div>

          {activeTab === 'news' && (
            <button
              onClick={() => setIsCreatingNews(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Write Article
            </button>
          )}

          {activeTab === 'events' && (
            <button
              onClick={() => setIsCreatingEvent(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Post Event
            </button>
          )}

          {activeTab === 'entertainment' && (
            <button
              onClick={() => setIsCreatingEntertainment(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Showcase
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#EADBCA] p-12 text-center text-stone-400">
              <Newspaper className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <div className="font-semibold text-stone-700">No news articles published yet</div>
              <div className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Articles can be drafted and published to share official updates, partner highlights, and economic news.
              </div>
              <button
                onClick={() => setIsCreatingNews(true)}
                className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-semibold text-xs rounded-xl"
              >
                Write First Article
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map(art => (
                <div key={art.id} className="bg-white rounded-xl border border-[#EADBCA] overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <img src={art.coverImage} alt={art.title} className="w-full h-36 object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-semibold uppercase mb-1">
                        <span>{art.category}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          art.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {art.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm">{art.title}</h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{art.summary || art.content}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>By {art.author}</span>
                    <button
                      onClick={() => handleDeleteItem('news', art.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#EADBCA] p-12 text-center text-stone-400">
              <Calendar className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <div className="font-semibold text-stone-700">No platform events scheduled</div>
              <div className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Schedule Gambian cultural festivals, business expos, and dining specials.
              </div>
              <button
                onClick={() => setIsCreatingEvent(true)}
                className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-semibold text-xs rounded-xl"
              >
                Schedule an Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-[#EADBCA] overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <img src={ev.image} alt={ev.title} className="w-full h-36 object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold mb-1">
                        <span>{ev.date} at {ev.time}</span>
                        <span className="text-stone-500">{ev.location}</span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm">{ev.title}</h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{ev.description}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>Org: {ev.organizer}</span>
                    <button
                      onClick={() => handleDeleteItem('events', ev.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'entertainment' && (
        <div className="space-y-4">
          {entertainment.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#EADBCA] p-12 text-center text-stone-400">
              <Film className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <div className="font-semibold text-stone-700">No spotlight videos or showcases</div>
              <div className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Add video clips and cultural showcases for local talent and Gambian food journeys.
              </div>
              <button
                onClick={() => setIsCreatingEntertainment(true)}
                className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-semibold text-xs rounded-xl"
              >
                Add First Showcase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entertainment.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-[#EADBCA] overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative aspect-video bg-stone-900">
                    <video src={item.mediaUrl} className="w-full h-full object-cover" controls playsInline />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">{item.category}</span>
                    <h3 className="font-bold text-stone-900 text-sm mt-0.5">{item.title}</h3>
                    <p className="text-xs text-stone-500 mt-1">{item.description}</p>
                  </div>
                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>{item.creator || 'SOHLA'}</span>
                    <button
                      onClick={() => handleDeleteItem('entertainment', item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Write News */}
      {isCreatingNews && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Write News Article</h3>
              <button onClick={() => setIsCreatingNews(false)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSaveNews} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Headline *</label>
                <input
                  required
                  type="text"
                  value={newsForm.title}
                  onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                  placeholder="e.g., SOHLA Launches Instant NAWEC Token Purchasing"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={newsForm.category}
                  onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Brief Summary</label>
                <textarea
                  rows={2}
                  value={newsForm.summary}
                  onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Full Article Body</label>
                <textarea
                  rows={4}
                  value={newsForm.content}
                  onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={newsForm.coverImage}
                  onChange={e => setNewsForm({ ...newsForm, coverImage: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={newsForm.status}
                  onChange={e => setNewsForm({ ...newsForm, status: e.target.value as ContentStatus })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="pending_review">Submit for Review</option>
                  <option value="published">Publish Live Immediately</option>
                </select>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingNews(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-stone-950 font-semibold rounded-lg">Save Article</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Event */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Post Platform Event</h3>
              <button onClick={() => setIsCreatingEvent(false)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Event Title *</label>
                <input
                  required
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Time</label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingEvent(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-stone-950 font-semibold rounded-lg">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Entertainment */}
      {isCreatingEntertainment && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Add Spotlight Showcase</h3>
              <button onClick={() => setIsCreatingEntertainment(false)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSaveEntertainment} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={entertainmentForm.title}
                  onChange={e => setEntertainmentForm({ ...entertainmentForm, title: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Video Stream URL</label>
                <input
                  required
                  type="text"
                  value={entertainmentForm.mediaUrl}
                  onChange={e => setEntertainmentForm({ ...entertainmentForm, mediaUrl: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={entertainmentForm.category}
                  onChange={e => setEntertainmentForm({ ...entertainmentForm, category: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={entertainmentForm.description}
                  onChange={e => setEntertainmentForm({ ...entertainmentForm, description: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingEntertainment(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-stone-950 font-semibold rounded-lg">Save Showcase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
