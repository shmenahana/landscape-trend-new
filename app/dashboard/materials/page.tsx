'use client'

import { useState } from 'react'
import { Plus, Search, Package, AlertCircle, TrendingDown } from 'lucide-react'

const mockMaterials = [
  {
    id: '1',
    name: 'Premium Mulch',
    sku: 'MLH-001',
    category: 'Mulch & Soil',
    unit: 'yard',
    costPerUnit: 35.00,
    currentStock: 45,
    minStock: 20,
    supplier: 'Green Supply Co',
    usage30Days: 125
  },
  {
    id: '2',
    name: 'Topsoil',
    sku: 'SOL-002',
    category: 'Mulch & Soil',
    unit: 'yard',
    costPerUnit: 28.50,
    currentStock: 12,
    minStock: 15,
    supplier: 'Green Supply Co',
    usage30Days: 98
  },
  {
    id: '3',
    name: 'River Rock (Small)',
    sku: 'RCK-003',
    category: 'Stone & Gravel',
    unit: 'ton',
    costPerUnit: 125.00,
    currentStock: 8,
    minStock: 5,
    supplier: 'Stone & Rock Depot',
    usage30Days: 12
  },
  {
    id: '4',
    name: 'Fertilizer 10-10-10',
    sku: 'FRT-004',
    category: 'Fertilizer',
    unit: 'bag',
    costPerUnit: 22.00,
    currentStock: 3,
    minStock: 10,
    supplier: 'Lawn Care Wholesale',
    usage30Days: 45
  },
  {
    id: '5',
    name: 'Grass Seed - Kentucky Blue',
    sku: 'SED-005',
    category: 'Seed',
    unit: 'bag',
    costPerUnit: 48.00,
    currentStock: 24,
    minStock: 12,
    supplier: 'Lawn Care Wholesale',
    usage30Days: 18
  },
]

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const lowStockItems = mockMaterials.filter(m => m.currentStock <= m.minStock)
  const totalValue = mockMaterials.reduce((sum, m) => sum + (m.currentStock * m.costPerUnit), 0)

  const filteredMaterials = mockMaterials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Materials & Inventory</h1>
            <p className="text-gray-600">Track materials usage and inventory levels</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Material
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Materials</div>
          <div className="text-2xl font-bold text-gray-900">{mockMaterials.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Inventory Value</div>
          <div className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Low Stock Items</div>
          <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Suppliers</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(mockMaterials.map(m => m.supplier)).size}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <div className="font-semibold text-red-900">Low Stock Alert</div>
              <div className="text-sm text-red-700">
                {lowStockItems.length} item(s) are at or below minimum stock levels
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  30-Day Usage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => {
                const isLowStock = material.currentStock <= material.minStock
                const totalValue = material.currentStock * material.costPerUnit

                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{material.name}</div>
                          {isLowStock && (
                            <div className="flex items-center text-xs text-red-600 mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Low stock
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        isLowStock ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {material.currentStock} {material.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {material.minStock} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${material.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <TrendingDown className="h-4 w-4 mr-1 text-blue-500" />
                        {material.usage30Days} {material.unit}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Material</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Name *
                  </label>
                  <input type="text" required className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input type="text" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select className="input">
                    <option>Mulch & Soil</option>
                    <option>Stone & Gravel</option>
                    <option>Fertilizer</option>
                    <option>Seed</option>
                    <option>Plants</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select className="input">
                    <option value="ea">Each</option>
                    <option value="yard">Yard</option>
                    <option value="ton">Ton</option>
                    <option value="bag">Bag</option>
                    <option value="pallet">Pallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Unit *
                  </label>
                  <input type="number" step="0.01" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input type="text" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <input type="number" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock
                  </label>
                  <input type="number" className="input" />
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
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
