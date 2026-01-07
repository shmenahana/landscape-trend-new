'use client'

import { useState } from 'react'
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, Eye, Send, Download } from 'lucide-react'
import Link from 'next/link'

const mockEstimates: any[] = []

const statusConfig = {
  draft: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  sent: { icon: Send, color: 'bg-blue-100 text-blue-800', label: 'Sent' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' }
}

export default function EstimatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredEstimates = mockEstimates.filter(estimate => {
    const matchesSearch = estimate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || estimate.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Estimates</h1>
            <p className="text-gray-600">Create and manage your project estimates</p>
          </div>
          <Link href="/dashboard/estimates/new">
            <button className="btn btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              New Estimate
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search estimates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-gray-900">
            ${mockEstimates.reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-blue-600">
            {mockEstimates.filter(e => e.status === 'sent').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {mockEstimates.filter(e => e.status === 'approved').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round((mockEstimates.filter(e => e.status === 'approved').length /
             mockEstimates.filter(e => e.status !== 'draft').length) * 100)}%
          </div>
        </div>
      </div>

      {/* Estimates List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstimates.map((estimate) => {
                const config = statusConfig[estimate.status as keyof typeof statusConfig]
                const StatusIcon = config.icon

                return (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{estimate.name}</div>
                          <div className="text-sm text-gray-500">{estimate.estimateNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{estimate.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${estimate.totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/dashboard/estimates/${estimate.id}`}>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-5 w-5" />
                          </button>
                        </Link>
                        <button className="text-green-600 hover:text-green-900">
                          <Send className="h-5 w-5" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
