import { useState } from 'react';
import { WashingMachine, Clock } from 'lucide-react';
import { machines } from '../data/mockData';

export function Laundry() {
  const [filter, setFilter] = useState<'all' | 'washer' | 'dryer'>('all');

  const filteredMachines =
    filter === 'all' ? machines : machines.filter((m) => m.type === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'finishing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'In Use';
      case 'finishing':
        return 'Finishing Soon';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Laundry Status</h1>
        <p className="text-gray-600">Real-time availability of washing machines and dryers</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 -mb-px transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Machines
        </button>
        <button
          onClick={() => setFilter('washer')}
          className={`px-6 py-3 -mb-px transition-colors ${
            filter === 'washer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Washers
        </button>
        <button
          onClick={() => setFilter('dryer')}
          className={`px-6 py-3 -mb-px transition-colors ${
            filter === 'dryer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dryers
        </button>
      </div>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMachines.map((machine) => (
          <div
            key={machine.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            {/* Machine Icon and Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <WashingMachine className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg">{machine.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{machine.type}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)}`} />
              <span className="text-sm">{getStatusText(machine.status)}</span>
            </div>

            {/* Time Remaining */}
            {machine.timeRemaining && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <Clock className="w-4 h-4" />
                <span>{machine.timeRemaining} min remaining</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-sm text-green-800 mb-1">Available Now</div>
          <div className="text-2xl text-green-600">
            {machines.filter((m) => m.status === 'available').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-sm text-red-800 mb-1">In Use</div>
          <div className="text-2xl text-red-600">
            {machines.filter((m) => m.status === 'busy').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="text-sm text-yellow-800 mb-1">Finishing Soon</div>
          <div className="text-2xl text-yellow-600">
            {machines.filter((m) => m.status === 'finishing').length}
          </div>
        </div>
      </div>
    </div>
  );
}
