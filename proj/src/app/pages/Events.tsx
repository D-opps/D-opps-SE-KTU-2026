import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:8000/api/events/';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location: string;
  attendees: any[];
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    end_date: '',
    location: '',
  });

  const getToken = () => localStorage.getItem('accessToken');

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ---------------- LOAD ----------------
  const loadEvents = async () => {
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Cannot load events');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CREATE ----------------
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          end_date: form.end_date || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      setEvents(prev => [data, ...prev]);
      setShowModal(false);

      setForm({
        title: '',
        description: '',
        date: '',
        end_date: '',
        location: '',
      });

      toast.success('Event created');
    } catch {
      toast.error('Create failed');
    }
  };

  // ---------------- RSVP ----------------
  const rsvp = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}${id}/rsvp/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      setEvents(prev =>
        prev.map(ev => (ev.id === id ? data.event : ev))
      );

      toast.success('Updated RSVP');
    } catch {
      toast.error('RSVP failed');
    }
  };

  // ---------------- DELETE ----------------
  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error();

      setEvents(prev => prev.filter(ev => ev.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-blue-50 p-6 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">
            Dorm Events
          </h1>
          <p className="text-blue-600">
            Join or create community events
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <p className="text-blue-600">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events yet</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {events.map(ev => (
            <div
              key={ev.id}
              className="bg-white p-5 rounded-xl shadow border border-blue-100"
            >

              <h2 className="text-xl font-bold text-blue-900">
                {ev.title}
              </h2>

              {ev.description && (
                <p className="text-gray-600 mt-2">
                  {ev.description}
                </p>
              )}

              {/* TIME BLOCK */}
              <div className="mt-4 text-sm text-gray-700 space-y-1">

                <div className="flex gap-2 items-center">
                  <Calendar size={16} />
                  <span><b>Start:</b> {formatDate(ev.date)}</span>
                </div>

                {ev.end_date && (
                  <div className="flex gap-2 items-center">
                    <Calendar size={16} />
                    <span><b>End:</b> {formatDate(ev.end_date)}</span>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <MapPin size={16} />
                  {ev.location}
                </div>

                <div className="flex gap-2 items-center">
                  <Users size={16} />
                  {ev.attendees?.length || 0} going
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 flex gap-2">

                <button
                  onClick={() => rsvp(ev.id)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Go/Leave
                </button>

                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <form
            onSubmit={createEvent}
            className="bg-white p-6 rounded-xl w-[420px]"
          >

            <h2 className="text-xl font-bold mb-4">
              Create Event
            </h2>

            <input
              className="w-full border p-2 mb-2 rounded"
              placeholder="Title"
              value={form.title}
              onChange={e =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <textarea
              className="w-full border p-2 mb-2 rounded"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <input
              type="datetime-local"
              className="w-full border p-2 mb-2 rounded"
              value={form.date}
              onChange={e =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="datetime-local"
              className="w-full border p-2 mb-2 rounded"
              value={form.end_date}
              onChange={e =>
                setForm({ ...form, end_date: e.target.value })
              }
            />

            <input
              className="w-full border p-2 mb-3 rounded"
              placeholder="Location"
              value={form.location}
              onChange={e =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border py-2 rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white rounded"
              >
                Create
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}