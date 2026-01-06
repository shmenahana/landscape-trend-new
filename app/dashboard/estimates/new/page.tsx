'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Calculator } from 'lucide-react'
import Link from 'next/link'

const templates = [
  {
    id: 't1',
    name: 'Basic Lawn Mowing',
    category: 'Maintenance',
    items: [
      { name: 'Lawn Mowing', quantity: 1, unit: 'acre', laborHours: 2, materialCost: 0, equipmentCost: 50 },
      { name: 'Edging', quantity: 1, unit: 'property', laborHours: 0.5, materialCost: 0, equipmentCost: 10 },
    ]
  },
  {
    id: 't2',
    name: 'Landscape Installation',
    category: 'Landscaping',
    items: [
      { name: 'Site Preparation', quantity: 1, unit: 'day', laborHours: 8, materialCost: 200, equipmentCost: 150 },
      { name: 'Plant Installation', quantity: 1, unit: 'sqft', laborHours: 4, materialCost: 500, equipmentCost: 100 },
      { name: 'Mulch Installation', quantity: 5, unit: 'yard', laborHours: 3, materialCost: 150, equipmentCost: 50 },
    ]
  },
  {
    id: 't3',
    name: 'Hardscape Project',
    category: 'Hardscaping',
    items: [
      { name: 'Paver Installation', quantity: 100, unit: 'sqft', laborHours: 16, materialCost: 800, equipmentCost: 200 },
      { name: 'Base Preparation', quantity: 1, unit: 'job', laborHours: 8, materialCost: 300, equipmentCost: 150 },
    ]
  },
]

interface EstimateItem {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  laborHours: number
  laborRate: number
  materialCost: number
  equipmentCost: number
  isOptional: boolean
}

export default function NewEstimatePage() {
  const [items, setItems] = useState<EstimateItem[]>([])
  const [laborRate, setLaborRate] = useState(45)
  const [overheadPercent, setOverheadPercent] = useState(15)
  const [profitPercent, setProfitPercent] = useState(20)
  const [taxPercent, setTaxPercent] = useState(6.5)

  const addItem = () => {
    const newItem: EstimateItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'ea',
      laborHours: 0,
      laborRate: laborRate,
      materialCost: 0,
      equipmentCost: 0,
      isOptional: false,
    }
    setItems([...items, newItem])
  }

  const addTemplate = (template: typeof templates[0]) => {
    const newItems = template.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      name: item.name,
      description: '',
      quantity: item.quantity,
      unit: item.unit,
      laborHours: item.laborHours,
      laborRate: laborRate,
      materialCost: item.materialCost,
      equipmentCost: item.equipmentCost,
      isOptional: false,
    }))
    setItems([...items, ...newItems])
  }

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const calculateItemTotal = (item: EstimateItem) => {
    const laborCost = item.laborHours * item.laborRate * item.quantity
    const materialTotal = item.materialCost * item.quantity
    const equipmentTotal = item.equipmentCost * item.quantity
    return laborCost + materialTotal + equipmentTotal
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const overheadAmount = subtotal * (overheadPercent / 100)
  const profitAmount = (subtotal + overheadAmount) * (profitPercent / 100)
  const beforeTax = subtotal + overheadAmount + profitAmount
  const tax = beforeTax * (taxPercent / 100)
  const total = beforeTax + tax

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Estimate</h1>
            <p className="text-gray-600">Build your estimate using templates or custom items</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/estimates">
              <button className="btn btn-outline">Cancel</button>
            </Link>
            <button className="btn btn-secondary">Save Draft</button>
            <button className="btn btn-primary">Send to Customer</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <select className="input">
                  <option>Select a customer...</option>
                  <option>John Smith</option>
                  <option>Sarah Johnson</option>
                  <option>ABC Corporation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimate Name *
                </label>
                <input type="text" className="input" placeholder="e.g., Front Yard Landscaping" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input type="date" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labor Rate ($/hour)
                </label>
                <input
                  type="number"
                  className="input"
                  value={laborRate}
                  onChange={(e) => setLaborRate(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => addTemplate(template)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-500">{template.category}</div>
                  <div className="text-xs text-gray-400 mt-1">{template.items.length} items</div>
                </button>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
              <button onClick={addItem} className="btn btn-primary btn-sm flex items-center">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No items yet. Add items manually or use a template.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            className="input input-sm"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            className="input input-sm"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <select
                            className="input input-sm"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          >
                            <option value="ea">Each</option>
                            <option value="sqft">Sq Ft</option>
                            <option value="hour">Hour</option>
                            <option value="day">Day</option>
                            <option value="yard">Yard</option>
                            <option value="bag">Bag</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            className="input input-sm"
                            placeholder="Labor hrs"
                            value={item.laborHours}
                            onChange={(e) => updateItem(item.id, 'laborHours', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 pt-2">
                            ${calculateItemTotal(item).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-900 mt-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="ml-8 mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Materials ($)</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={item.materialCost}
                          onChange={(e) => updateItem(item.id, 'materialCost', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Equipment ($)</label>
                        <input
                          type="number"
                          className="input input-sm"
                          value={item.equipmentCost}
                          onChange={(e) => updateItem(item.id, 'equipmentCost', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="flex items-center mt-6">
                          <input
                            type="checkbox"
                            checked={item.isOptional}
                            onChange={(e) => updateItem(item.id, 'isOptional', e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2 text-xs text-gray-600">Optional item</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Summary</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overhead (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={overheadPercent}
                  onChange={(e) => setOverheadPercent(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={profitPercent}
                  onChange={(e) => setProfitPercent(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overhead ({overheadPercent}%)</span>
                <span className="font-medium">${overheadAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit ({profitPercent}%)</span>
                <span className="font-medium">${profitAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({taxPercent}%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-1">Break-even</div>
              <div className="text-2xl font-bold text-green-700">${(subtotal + overheadAmount).toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-1">Net Profit: ${profitAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
