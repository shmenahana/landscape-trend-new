'use client'

import { useState } from 'react'
import { Plus, Search, Wrench, AlertTriangle, CheckCircle } from 'lucide-react'

const mockEquipment: any[] = []

const statusConfig = {
  available: { color: 'bg-green-100 text-green-800', label: 'Available', icon: CheckCircle },
  in_use: { color: 'bg-blue-100 text-blue-800', label: 'In Use', icon: CheckCircle },
  maintenance: { color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance', icon: AlertTriangle }
}

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const availableCount = mockEquipment.filter(e => e.status === 'available').length
  const inUseCount = mockEquipment.filter(e => e.status === 'in_use').length
  const maintenanceCount = mockEquipment.filter(e => e.status === 'maintenance').length

  const filteredEquipment = mockEquipment.filter(equip =>
    equip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.make.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment</h1>
            <p className="text-gray-600">Manage equipment inventory and track usage</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Equipment
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Equipment</div>
          <div className="text-2xl font-bold text-gray-900">{mockEquipment.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Available</div>
          <div className="text-2xl font-bold text-green-600">{availableCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">In Use</div>
          <div className="text-2xl font-bold text-blue-600">{inUseCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Maintenance</div>
          <div className="text-2xl font-bold text-yellow-600">{maintenanceCount}</div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEquipment.map((equipment) => {
          const config = statusConfig[equipment.status as keyof typeof statusConfig]
          const StatusIcon = config.icon

          return (
            <div key={equipment.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{equipment.name}</h3>
                    <p className="text-sm text-gray-500">
                      {equipment.make} {equipment.model} ({equipment.year})
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${config.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <div className="text-sm font-semibold text-gray-900">{equipment.equipmentType}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">30-Day Usage</div>
                  <div className="text-sm font-semibold text-gray-900">{equipment.usage30Days} hrs</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Hourly Rate</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${equipment.hourlyRate.toFixed(2)}/hr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Daily Rate</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${equipment.dailyRate.toFixed(2)}/day
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Maintenance</span>
                  <span className="font-medium">
                    {new Date(equipment.lastMaintenance).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Equipment</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name *
                  </label>
                  <input type="text" required className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select className="input">
                    <option>Mower</option>
                    <option>Truck</option>
                    <option>Trailer</option>
                    <option>Heavy Equipment</option>
                    <option>Hand Tool</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
                  <input type="text" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input type="text" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input type="number" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select className="input">
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input type="number" step="0.01" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Rate ($)
                  </label>
                  <input type="number" step="0.01" className="input" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
