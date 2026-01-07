import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Clock,
  Plus,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value="$0"
          change=""
          trend="up"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
        />
        <StatCard
          title="Active Jobs"
          value="0"
          change=""
          trend="up"
          icon={<Briefcase className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Pending Estimates"
          value="0"
          change=""
          trend="up"
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
        />
        <StatCard
          title="Total Customers"
          value="0"
          change=""
          trend="up"
          icon={<Users className="h-6 w-6 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Jobs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Jobs</h2>
            <Link href="/dashboard/jobs" className="text-sm text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No active jobs yet</p>
            <Link href="/dashboard/jobs">
              <button className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Job
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Estimates */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Estimates</h2>
            <Link href="/dashboard/estimates" className="text-sm text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No estimates yet</p>
            <Link href="/dashboard/estimates/new">
              <button className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Estimate
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Schedule Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
          <Link href="/dashboard/schedule" className="text-sm text-green-600 hover:text-green-700">
            View calendar
          </Link>
        </div>
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No scheduled jobs for today</p>
          <Link href="/dashboard/schedule">
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Schedule a Job
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      {change && (
        <div className={`flex items-center text-sm ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          {change} from last month
        </div>
      )}
    </div>
  )
}
