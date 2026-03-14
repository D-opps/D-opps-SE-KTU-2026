import { WashingMachine, Timer, Check, AlertCircle, XCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { machines as initialMachines } from '../data/mockData';
import { useState, useEffect } from 'react';

type MachineStatus = 'free' | 'occupied' | 'out-of-order';

interface Machine {
  id: number;
  name: string;
  type: 'washer' | 'dryer';
  status: MachineStatus;
  location: string;
  timeLeft?: number;
}

export function Laundry() {
  const [machines, setMachines] = useState<Machine[]>(
    initialMachines.map(m => ({
      ...m,
      status: m.status === 'available' ? 'free' : m.status === 'in-use' ? 'occupied' : 'free'
    }))
  );
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'washer' as 'washer' | 'dryer',
    location: '',
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsAdmin(role === 'admin');
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines((prevMachines) =>
        prevMachines.map((machine) => {
          if (machine.status === 'occupied' && machine.timeLeft && machine.timeLeft > 0) {
            const newTimeLeft = machine.timeLeft - 1;
            // If timer reaches 0, set status to free
            if (newTimeLeft === 0) {
              return { ...machine, timeLeft: undefined, status: 'free' };
            }
            return { ...machine, timeLeft: newTimeLeft };
          }
          return machine;
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'out-of-order':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case 'free':
        return <Check className="w-5 h-5" />;
      case 'occupied':
        return <Clock className="w-5 h-5" />;
      case 'out-of-order':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (machineId: number, newStatus: MachineStatus, minutes?: number) => {
    setMachines((prevMachines) =>
      prevMachines.map((machine) =>
        machine.id === machineId
          ? {
              ...machine,
              status: newStatus,
              timeLeft: newStatus === 'occupied' && minutes ? minutes : undefined,
            }
          : machine
      )
    );
    setSelectedMachine(null);
    setTimerMinutes(30);
  };

  const openStatusModal = (machineId: number) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine?.timeLeft) {
      setTimerMinutes(machine.timeLeft);
    } else {
      setTimerMinutes(30);
    }
    setSelectedMachine(machineId);
  };

  const selectedMachineData = machines.find((m) => m.id === selectedMachine);

  const handleAddMachine = () => {
    const newId = machines.length > 0 ? machines[machines.length - 1].id + 1 : 1;
    const newMachineData: Machine = {
      id: newId,
      name: newMachine.name,
      type: newMachine.type,
      status: 'free',
      location: newMachine.location,
    };
    setMachines([...machines, newMachineData]);
    setIsAddMachineModalOpen(false);
    setNewMachine({ name: '', type: 'washer', location: '' });
  };

  const handleDeleteMachine = (machineId: number) => {
    setMachines(machines.filter(m => m.id !== machineId));
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Laundry Room</h1>
        <p className="text-gray-600">Check machine availability and manage status</p>
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg mb-4">Status Legend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm">Free - Ready to use</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Occupied - Currently in use</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm">Out of Order - Needs maintenance</span>
          </div>
        </div>
      </div>

      {/* Washers */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Washing Machines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines
            .filter((machine) => machine.type === 'washer')
            .map((machine) => (
              <div
                key={machine.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <WashingMachine className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{machine.name}</h3>
                      <p className="text-sm text-gray-500">{machine.location}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getStatusColor(
                    machine.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(machine.status)}
                    <span className="text-sm capitalize">{machine.status.replace('-', ' ')}</span>
                  </div>
                  {machine.timeLeft && (
                    <span className="text-sm">{machine.timeLeft} min</span>
                  )}
                </div>

                <button
                  onClick={() => openStatusModal(machine.id)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Change Status
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMachine(machine.id)}
                    className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete Machine
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Dryers */}
      <div>
        <h2 className="text-xl mb-4">Dryers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines
            .filter((machine) => machine.type === 'dryer')
            .map((machine) => (
              <div
                key={machine.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <WashingMachine className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{machine.name}</h3>
                      <p className="text-sm text-gray-500">{machine.location}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getStatusColor(
                    machine.status
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(machine.status)}
                    <span className="text-sm capitalize">{machine.status.replace('-', ' ')}</span>
                  </div>
                  {machine.timeLeft && (
                    <span className="text-sm">{machine.timeLeft} min</span>
                  )}
                </div>

                <button
                  onClick={() => openStatusModal(machine.id)}
                  className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Change Status
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMachine(machine.id)}
                    className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete Machine
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Add Machine Button */}
      {isAdmin && (
        <button
          onClick={() => setIsAddMachineModalOpen(true)}
          className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          Add Machine
        </button>
      )}

      {/* Status Change Modal */}
      {selectedMachine !== null && selectedMachineData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl mb-4">Change Machine Status</h2>
            <p className="text-gray-600 mb-6">
              Update the status for {selectedMachineData.name}
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleStatusChange(selectedMachine, 'free')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedMachineData.status === 'free'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Free</div>
                    <div className="text-sm text-gray-600">Machine is ready to use</div>
                  </div>
                </div>
              </button>

              <div className={`p-4 rounded-lg border-2 ${
                selectedMachineData.status === 'occupied'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Occupied</div>
                    <div className="text-sm text-gray-600">Machine is currently in use</div>
                  </div>
                </div>
                <div className="ml-8">
                  <label className="block text-sm text-gray-700 mb-2">
                    Set Timer (minutes):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleStatusChange(selectedMachine, 'occupied', timerMinutes)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Set Occupied
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStatusChange(selectedMachine, 'out-of-order')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedMachineData.status === 'out-of-order'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium">Out of Order</div>
                    <div className="text-sm text-gray-600">Machine needs maintenance</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setSelectedMachine(null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {isAddMachineModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl mb-4">Add New Machine</h2>
            <p className="text-gray-600 mb-6">
              Enter details for the new machine
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Plus className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Add Machine</div>
                    <div className="text-sm text-gray-600">Enter machine details</div>
                  </div>
                </div>
                <div className="ml-8">
                  <label className="block text-sm text-gray-700 mb-2">
                    Machine Name:
                  </label>
                  <input
                    type="text"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="block text-sm text-gray-700 mb-2 mt-2">
                    Machine Type:
                  </label>
                  <select
                    value={newMachine.type}
                    onChange={(e) => setNewMachine({ ...newMachine, type: e.target.value as 'washer' | 'dryer' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="washer">Washer</option>
                    <option value="dryer">Dryer</option>
                  </select>
                  <label className="block text-sm text-gray-700 mb-2 mt-2">
                    Location:
                  </label>
                  <input
                    type="text"
                    value={newMachine.location}
                    onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAddMachine}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Machine
            </button>

            <button
              onClick={() => setIsAddMachineModalOpen(false)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}