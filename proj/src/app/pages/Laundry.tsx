import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const MAX_MINUTES = 200;

const formatTimeLeft = (endTime?: string) => {
  if (!endTime) return null;

  const total = Date.parse(endTime) - Date.now();

  if (total <= 0) return '00:00:00';

  const h = Math.floor((total / (1000 * 60 * 60)) % 24);
  const m = Math.floor((total / 1000 / 60) % 60);
  const s = Math.floor((total / 1000) % 60);

  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function Laundry() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMachine, setSelectedMachine] = useState<any | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'washer'
  });

  const [timerMinutes, setTimerMinutes] = useState(30);
  const [userName, setUserName] = useState('');

  const isAdmin = localStorage.getItem('userRole') === 'admin';


  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('accessToken');

  // force rerender every second
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/machines/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMachines(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    status: string,
    minutes: number = 0,
    name: string = ''
  ) => {
    if (status === 'occupied') {
      if (!name.trim()) {
        toast.error('Enter your name');
        return;
      }

      if (minutes < 1) {
        toast.error('Minimum 1 minute');
        return;
      }

      // LIMIT 200 MINUTES
      if (minutes > MAX_MINUTES) {
        toast.error(`Maximum ${MAX_MINUTES} minutes`);
        return;
      }
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/machines/${selectedMachine.id}/report_status/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            minutes,
            occupied_by: name
          })
        }
      );

      if (res.ok) {
        toast.success('Status updated');

        setSelectedMachine(null);

        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  // ADMIN CREATE MACHINE
    const handleCreate = async () => {
  if (!newMachine.name.trim()) {
    toast.error('Enter machine name');
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8000/api/machines/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newMachine.name,
        type: newMachine.type,
        dormitory: user.dormitory
      })
    });

    const data = await res.json();

    console.log(data);

    if (res.ok) {
      toast.success('Machine created');

      setIsAddModalOpen(false);

      setNewMachine({
        name: '',
        type: 'washer'
      });

      fetchData();
    } else {
      console.error(data);
      toast.error('Failed to create machine');
    }
  } catch (err) {
    console.error(err);
    toast.error('Server error');
  }
};

  // ADMIN DELETE MACHINE
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/machines/${id}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        toast.success('Machine deleted');
        fetchData();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  const renderMachineList = (type: string) => (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-700 mb-4 capitalize">
        {type}s
      </h2>

      <div className="grid gap-3">
        {machines
          .filter(m => m.type === type)
          .map(m => {
            const isOccupied = m.status === 'occupied';

            const isBroken = m.status === 'out-of-order';

            return (
              <div
                key={m.id}
                className="p-4 bg-white rounded-2xl border flex justify-between items-center shadow-sm"
              >
                <div>
                  <h3 className="font-bold">{m.name}</h3>

                  <p className="text-xs text-gray-500">
                    {isOccupied
                      ? `By: ${m.occupied_by}`
                      : m.status}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isOccupied ? (
                    <span className="font-mono font-bold text-indigo-600">
                      {formatTimeLeft(m.end_time)}
                    </span>
                  ) : isBroken ? (
                    <AlertTriangle
                      className="text-red-500"
                      size={20}
                    />
                  ) : (
                    <CheckCircle2
                      className="text-green-500"
                      size={20}
                    />
                  )}

                  <button
                    onClick={() => setSelectedMachine(m)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Manage
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2
          className="animate-spin text-indigo-600"
          size={40}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <Clock className="text-indigo-600" />
          Laundry Hub
        </h1>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white p-2 rounded-xl"
          >
            <Plus />
          </button>
        )}
      </div>

      {renderMachineList('washer')}
      {renderMachineList('dryer')}

      {/* MANAGE MODAL */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl">
            <h2 className="font-bold mb-4">
              Manage {selectedMachine.name}
            </h2>

            <input
              placeholder="Your name"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full p-3 bg-gray-100 rounded-xl mb-3"
            />

            <input
              type="number"
              min={1}
              max={MAX_MINUTES}
              value={timerMinutes}
              onChange={e =>
                setTimerMinutes(Number(e.target.value))
              }
              className="w-full p-3 bg-gray-100 rounded-xl mb-2"
            />

            <p className="text-xs text-gray-500 mb-6">
              Max time: {MAX_MINUTES} minutes
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleAction(
                    'occupied',
                    timerMinutes,
                    userName
                  )
                }
                className="bg-indigo-600 text-white py-3 rounded-xl font-bold"
              >
                Start
              </button>

              <button
                onClick={() => handleAction('free')}
                className="bg-green-100 text-green-700 py-3 rounded-xl font-bold"
              >
                Free
              </button>

              <button
                onClick={() =>
                  handleAction('out-of-order')
                }
                className="col-span-2 bg-red-100 text-red-600 py-3 rounded-xl font-bold"
              >
                Report Broken
              </button>
            </div>

            <button
              onClick={() => setSelectedMachine(null)}
              className="w-full mt-3 text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ADD MACHINE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl">
            <h2 className="font-bold text-lg mb-4">
              Add Machine
            </h2>

            <input
              placeholder="Machine name"
              value={newMachine.name}
              onChange={e =>
                setNewMachine({
                  ...newMachine,
                  name: e.target.value
                })
              }
              className="w-full p-3 bg-gray-100 rounded-xl mb-3"
            />

            <select
              value={newMachine.type}
              onChange={e =>
                setNewMachine({
                  ...newMachine,
                  type: e.target.value
                })
              }
              className="w-full p-3 bg-gray-100 rounded-xl mb-6"
            >
              <option value="washer">Washer</option>
              <option value="dryer">Dryer</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCreate}
                className="bg-indigo-600 text-white py-3 rounded-xl font-bold"
              >
                Create
              </button>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}