import React, { useState, useEffect, useCallback } from 'react';
import { 
  WashingMachine, Wind, Plus, Clock, 
  Building2, AlertTriangle, X, Check, Loader2, Trash2, ArrowRight
} from 'lucide-react';

type MachineStatus = 'free' | 'occupied' | 'out-of-order';

interface Machine {
  id: number;
  name: string;
  type: 'washer' | 'dryer';
  status: MachineStatus;
  time_left: number; 
  dormitory: number;
}

export function Laundry() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDorm, setUserDorm] = useState<number | null>(null);
  
  // Модалки
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Форма нової машинки (без location і dormitory - вони автоматичні)
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'washer' as 'washer' | 'dryer',
  });

  const [timerMinutes, setTimerMinutes] = useState(30);
  
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  const token = localStorage.getItem('accessToken');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Спочатку отримуємо профіль, щоб знати гуртожиток
      const profileRes = await fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const dorm = profileData.profile?.dormitory || profileData.dormitory;
      setUserDorm(dorm);

      // 2. Отримуємо машинки
      const res = await fetch('http://127.0.0.1:8000/api/machines/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMachines(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/machines/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Бекенд сам візьме dormitory з request.user
        body: JSON.stringify({
          ...newMachine,
          dormitory: userDorm 
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewMachine({ name: '', type: 'washer' });
        fetchData();
      }
    } catch (err) {
      alert("Error creating machine");
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: MachineStatus, minutes: number = 0) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/machines/${id}/report_status/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, minutes: Number(minutes) })
      });
      if (res.ok) {
        fetchData();
        setSelectedMachineId(null);
      }
    } catch (e) { alert("Failed to update"); }
  };

  const handleDeleteMachine = async (id: number) => {
    if (!window.confirm("Delete machine?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/machines/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#2A85FF] mb-2" size={40} />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 bg-[#F8F9FA] min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 bg-[#2A85FF] rounded-full" />
          <div>
            <h1 className="text-3xl font-bold text-[#1A1D1F]">Laundry Hub</h1>
            <p className="text-gray-400 text-sm font-medium">Dormitory #{userDorm || '...'}</p>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#2A85FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={20} /> Add Machine
          </button>
        )}
      </div>

      {/* COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {['washer', 'dryer'].map((type) => (
          <div key={type} className="space-y-4">
            <h2 className="text-lg font-bold text-[#1A1D1F] px-2 flex items-center gap-2 capitalize">
              {type === 'washer' ? <WashingMachine size={18} className="text-blue-500"/> : <Wind size={18} className="text-purple-500"/>}
              {type}s
            </h2>
            <div className="grid gap-3">
              {machines.filter(m => m.type === type).map(m => (
                <MachineCard 
                  key={m.id} 
                  machine={m} 
                  isAdmin={isAdmin}
                  onUpdate={() => setSelectedMachineId(m.id)} 
                  onDelete={() => handleDeleteMachine(m.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: START/UPDATE */}
      {selectedMachineId && (
        <StatusModal 
          machine={machines.find(m => m.id === selectedMachineId)}
          timerMinutes={timerMinutes}
          setTimerMinutes={setTimerMinutes}
          onClose={() => setSelectedMachineId(null)}
          onConfirm={handleStatusUpdate}
        />
      )}

      {/* MODAL: ADD MACHINE (ADMIN) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1A1D1F]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateMachine} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-[#1A1D1F] mb-6">New Machine</h2>
            <div className="space-y-4">
              <input 
                required
                placeholder="Machine Name (e.g. LG #1)"
                className="w-full p-4 rounded-xl bg-gray-50 border-none font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                value={newMachine.name}
                onChange={e => setNewMachine({...newMachine, name: e.target.value})}
              />
              <div className="flex gap-2">
                {['washer', 'dryer'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewMachine({...newMachine, type: t as any})}
                    className={`flex-1 p-3 rounded-xl font-bold capitalize transition-all ${newMachine.type === t ? 'bg-[#1A1D1F] text-white' : 'bg-gray-50 text-gray-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-[#2A85FF] text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
                  Create in Dorm #{userDorm}
                </button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full py-3 text-gray-400 text-sm font-bold mt-2">Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MachineCard({ machine, isAdmin, onUpdate, onDelete }: any) {
  const isFree = machine.status === 'free';
  const isOccupied = machine.status === 'occupied';

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#EDF0F2] flex items-center justify-between hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isFree ? 'bg-green-50 text-green-500' : 
          isOccupied ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'
        }`}>
          {machine.type === 'washer' ? <WashingMachine size={22}/> : <Wind size={22}/>}
        </div>
        <div>
          <h3 className="font-bold text-[#1A1D1F] leading-tight">{machine.name}</h3>
          <p className={`text-[11px] font-bold uppercase mt-0.5 ${isFree ? 'text-green-500' : 'text-gray-300'}`}>
             {isFree ? 'Available' : machine.status.replace('-', ' ')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isOccupied && (
          <div className="flex items-center gap-1 text-[#2A85FF] font-bold bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
            <Clock size={14} /> {machine.time_left}m
          </div>
        )}
        <div className="flex items-center">
          {isAdmin && (
            <button onClick={onDelete} className="p-2 text-gray-200 hover:text-red-400 transition-colors mr-1">
              <Trash2 size={18} />
            </button>
          )}
          <button 
            onClick={onUpdate}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isFree ? 'bg-[#1A1D1F] text-white hover:bg-[#2A85FF]' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {isFree ? 'Use' : 'Edit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusModal({ machine, timerMinutes, setTimerMinutes, onClose, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-[#1A1D1F]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1A1D1F]">Status Control</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500"><X size={20}/></button>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => onConfirm(machine.id, 'free')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all font-bold text-gray-700"
          >
            Mark as Free <Check className="text-green-500" size={18}/>
          </button>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Set Timer (minutes)</p>
            <div className="flex gap-2">
              <input 
                type="number" value={timerMinutes} 
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="w-16 p-2 rounded-lg border-none font-bold text-center"
              />
              <button 
                onClick={() => onConfirm(machine.id, 'occupied', timerMinutes)}
                className="flex-1 bg-[#2A85FF] text-white rounded-lg font-bold text-sm"
              >
                Start Session
              </button>
            </div>
          </div>

          <button 
            onClick={() => onConfirm(machine.id, 'out-of-order')}
            className="w-full py-3 text-red-400 font-bold text-xs uppercase hover:bg-red-50 rounded-xl transition-all"
          >
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}