'use client'

import { useState } from 'react'
import { Plus, Search, Briefcase, TrendingUp, TrendingDown, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

const mockJobs = [
  {
    id: '1',
    jobNumber: 'JOB-2601-0001',
    name: 'Smith Residence - Lawn Care',
    customer: 'John Smith',
    status: 'in_progress',
    estimatedCost: 2500,
    actualCost: 1625,
    estimatedHours: 40,
    actualHours: 26,
    progress: 65,
    startDate: '2026-01-02',
    budgetedAmount: 3000
  },
  {
    id: '2',
    jobNumber: 'JOB-2601-0002',
    name: 'Commercial Plaza Landscaping',
    customer: 'ABC Corp',
    status: 'in_progress',
    estimatedCost: 15000,
    actualCost: 6000,
    estimatedHours: 200,
    actualHours: 80,
    progress: 40,
    startDate: '2025-12-28',
    budgetedAmount: 18000
  },
  {
    id: '3',
    jobNumber: 'JOB-2512-0045',
    name: 'Johnson Property - Tree Removal',
    customer: 'Sarah Johnson',
    status: 'scheduled',
    estimatedCost: 3200,
    actualCost: 0,
    estimatedHours: 16,
    actualHours: 0,
    progress: 0,
    startDate: '2026-01-10',
    budgetedAmount: 3500
  },
  {
    id: '4',
    jobNumber: 'JOB-2512-0038',
    name: 'Williams Estate - Full Landscaping',
    customer: 'Robert Williams',
    status: 'completed',
    estimatedCost: 8000,
    actualCost: 8450,
    estimatedHours: 120,
    actualHours: 128,
    progress: 100,
    startDate: '2025-12-01',
    budgetedAmount: 9500
  },
]

const statusConfig = {
  scheduled: { color: 'bg-yellow-100 text-yellow-800', label: 'Scheduled' },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
}

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs & Projects</h1>
            <p className="text-gray-600">Track job costs and profitability in real-time</p>
          </div>
          <Link href="/dashboard/jobs/new">
            <button className="btn btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              New Job
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
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
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Active Jobs</div>
          <div className="text-2xl font-bold text-blue-600">
            {mockJobs.filter(j => j.status === 'in_progress').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            ${mockJobs.reduce((sum, j) => sum + j.budgetedAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Avg. Margin</div>
          <div className="text-2xl font-bold text-green-600">28%</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">On Budget</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockJobs.filter(j => j.actualCost <= j.estimatedCost).length}/{mockJobs.filter(j => j.actualCost > 0).length}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => {
          const config = statusConfig[job.status as keyof typeof statusConfig]
          const variance = job.actualCost - job.estimatedCost
          const variancePercent = job.estimatedCost > 0 ? (variance / job.estimatedCost) * 100 : 0
          const isOverBudget = job.actualCost > job.estimatedCost
          const hourVariance = job.actualHours - job.estimatedHours

          return (
            <div key={job.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <Briefcase className="h-6 w-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{job.name}</h3>
                    <p className="text-sm text-gray-500">{job.jobNumber} • {job.customer}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                  {config.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${job.progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              {/* Cost Tracking */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Estimated Cost</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${job.estimatedCost.toLocaleString()}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Actual Cost</div>
                  <div className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ${job.actualCost.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Variance */}
              {job.actualCost > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isOverBudget ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className="flex items-center">
                    {isOverBudget ? (
                      <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${isOverBudget ? 'text-red-800' : 'text-green-800'}`}>
                      {isOverBudget ? 'Over' : 'Under'} Budget
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                    ${Math.abs(variance).toLocaleString()} ({Math.abs(variancePercent).toFixed(1)}%)
                  </span>
                </div>
              )}

              {/* Hours */}
              <div className="flex justify-between text-sm mt-4 pt-4 border-t border-gray-200">
                <div>
                  <span className="text-gray-600">Hours: </span>
                  <span className="font-medium">{job.actualHours} / {job.estimatedHours}</span>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-5 w-5" />
                    </button>
                  </Link>
                  <button className="text-green-600 hover:text-green-900">
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
