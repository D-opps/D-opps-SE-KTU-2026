import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:8000/api/events/';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  dormitory: number;
  attendees: any[];
  creatorName: string;
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  });

  const token = localStorage.getItem('accessToken');

  // ---------------- FETCH EVENTS ----------------
  const loadEvents = async () => {
    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      toast.error('Cannot load events');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CREATE EVENT ----------------
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        console.log('CREATE ERROR:', err);
        throw new Error();
      }

      const data = await res.json();

      setEvents(prev => [data, ...prev]);
      setShowModal(false);

      setForm({
        title: '',
        description: '',
        date: '',
        location: '',
      });

      toast.success('Event created');
    } catch (err) {
      toast.error('Create failed');
    }
  };

  // ---------------- RSVP ----------------
  const rsvp = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}${id}/rsvp/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setEvents(prev =>
        prev.map(ev => (ev.id === id ? data.event : ev))
      );

      toast.success('Updated RSVP');
    } catch {
      toast.error('RSVP failed');
    }
  };

  // ---------------- DELETE EVENT ----------------
  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
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
      <div className="flex justify-between items-center mb-6">
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          Create
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-blue-600">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-blue-500">No events yet</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {events.map(ev => (
            <div
              key={ev.id}
              className="bg-white rounded-xl shadow border border-blue-100 p-5"
            >
              <h2 className="text-xl font-bold text-blue-900">
                {ev.title}
              </h2>

              <p className="text-gray-600 mt-2">
                {ev.description}
              </p>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex gap-2 items-center">
                  <Calendar size={16} />
                  {ev.date}
                </div>

                <div className="flex gap-2 items-center">
                  <MapPin size={16} />
                  {ev.location}
                </div>

                <div className="flex gap-2 items-center">
                  <Users size={16} />
                  {ev.attendees?.length || 0} going
                </div>
              </div>

              {/* RSVP */}
              <button
                onClick={() => rsvp(ev.id)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                RSVP
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteEvent(ev.id)}
                className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form
            onSubmit={createEvent}
            className="bg-white p-6 rounded-xl w-[400px]"
          >
            <h2 className="text-xl font-bold text-blue-900 mb-4">
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
              placeholder="Description"
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