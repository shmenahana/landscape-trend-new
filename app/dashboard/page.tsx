import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react'

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
          value="$124,500"
          change="+12.5%"
          trend="up"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
        />
        <StatCard
          title="Active Jobs"
          value="23"
          change="+3"
          trend="up"
          icon={<Briefcase className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Pending Estimates"
          value="8"
          change="-2"
          trend="down"
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
        />
        <StatCard
          title="Total Customers"
          value="156"
          change="+8"
          trend="up"
          icon={<Users className="h-6 w-6 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Jobs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Jobs</h2>
            <a href="/dashboard/jobs" className="text-sm text-green-600 hover:text-green-700">
              View all
            </a>
          </div>
          <div className="space-y-4">
            <JobItem
              name="Smith Residence - Lawn Care"
              customer="John Smith"
              status="in_progress"
              progress={65}
              budget={2500}
              spent={1625}
            />
            <JobItem
              name="Commercial Plaza Landscaping"
              customer="ABC Corp"
              status="in_progress"
              progress={40}
              budget={15000}
              spent={6000}
            />
            <JobItem
              name="Johnson Property - Tree Removal"
              customer="Sarah Johnson"
              status="scheduled"
              progress={0}
              budget={3200}
              spent={0}
            />
          </div>
        </div>

        {/* Recent Estimates */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Estimates</h2>
            <a href="/dashboard/estimates" className="text-sm text-green-600 hover:text-green-700">
              View all
            </a>
          </div>
          <div className="space-y-4">
            <EstimateItem
              name="Williams Estate - Full Landscaping"
              customer="Robert Williams"
              amount={8500}
              status="sent"
            />
            <EstimateItem
              name="Park Street Garden Design"
              customer="City of Springfield"
              amount={12000}
              status="draft"
            />
            <EstimateItem
              name="Residential Lawn Maintenance"
              customer="Emily Davis"
              amount={1800}
              status="approved"
            />
          </div>
        </div>
      </div>

      {/* Schedule Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
          <a href="/dashboard/schedule" className="text-sm text-green-600 hover:text-green-700">
            View calendar
          </a>
        </div>
        <div className="space-y-3">
          <ScheduleItem
            time="8:00 AM - 12:00 PM"
            title="Lawn Mowing - Smith Residence"
            crew="Crew A (3 members)"
          />
          <ScheduleItem
            time="1:00 PM - 5:00 PM"
            title="Landscaping Installation - Johnson Property"
            crew="Crew B (4 members)"
          />
          <ScheduleItem
            time="9:00 AM - 11:00 AM"
            title="Property Assessment - Williams Estate"
            crew="John (Manager)"
          />
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
      <div className={`flex items-center text-sm ${
        trend === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
        {change} from last month
      </div>
    </div>
  )
}

function JobItem({
  name,
  customer,
  status,
  progress,
  budget,
  spent
}: {
  name: string
  customer: string
  status: string
  progress: number
  budget: number
  spent: number
}) {
  const statusColors = {
    in_progress: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">{customer}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Budget: ${budget.toLocaleString()}</span>
        <span className={spent > budget ? 'text-red-600' : 'text-gray-900'}>
          Spent: ${spent.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function EstimateItem({
  name,
  customer,
  amount,
  status
}: {
  name: string
  customer: string
  amount: number
  status: string
}) {
  const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-600', label: 'Draft' },
    sent: { icon: AlertCircle, color: 'text-blue-600', label: 'Sent' },
    approved: { icon: CheckCircle, color: 'text-green-600', label: 'Approved' }
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{name}</div>
        <div className="text-sm text-gray-500">{customer}</div>
      </div>
      <div className="text-right ml-4">
        <div className="font-semibold text-gray-900">${amount.toLocaleString()}</div>
        <div className={`flex items-center text-sm ${config.color}`}>
          <Icon className="h-4 w-4 mr-1" />
          {config.label}
        </div>
      </div>
    </div>
  )
}

function ScheduleItem({
  time,
  title,
  crew
}: {
  time: string
  title: string
  crew: string
}) {
  return (
    <div className="flex items-start space-x-4 border-l-4 border-green-600 pl-4 py-2">
      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{time}</div>
        <div className="text-sm text-gray-500">{crew}</div>
      </div>
    </div>
  )
}
