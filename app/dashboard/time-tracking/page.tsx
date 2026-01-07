'use client'

import { useState } from 'react'
import { Clock, MapPin, Play, Square, Users, Download } from 'lucide-react'

const mockTimeEntries: any[] = []

const mockCrewMembers: any[] = []

export default function TimeTrackingPage() {
  const [selectedDate, setSelectedDate] = useState('2026-01-06')
  const [viewMode, setViewMode] = useState<'entries' | 'crew'>('entries')

  const totalHours = mockTimeEntries
    .filter(entry => entry.status === 'completed')
    .reduce((sum, entry) => sum + entry.totalHours, 0)

  const activeEntries = mockTimeEntries.filter(entry => entry.status === 'active').length

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
            <p className="text-gray-600">Track crew time and GPS locations for accurate job costing</p>
          </div>
          <div className="flex space-x-3">
            <button className="btn btn-outline flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* View Toggle and Date Picker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('entries')}
              className={`btn ${viewMode === 'entries' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              Time Entries
            </button>
            <button
              onClick={() => setViewMode('crew')}
              className={`btn ${viewMode === 'crew' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              Crew Status
            </button>
          </div>
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Total Hours Today</div>
          <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Active Clock-Ins</div>
          <div className="text-2xl font-bold text-green-600">{activeEntries}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Crew Members</div>
          <div className="text-2xl font-bold text-gray-900">{mockCrewMembers.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600 mb-1">Avg. Hours/Member</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockCrewMembers.length > 0 ? (totalHours / mockCrewMembers.length).toFixed(1) : '0.0'}
          </div>
        </div>
      </div>

      {viewMode === 'entries' ? (
        /* Time Entries View */
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Break
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockTimeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{entry.user}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.job}</div>
                      <div className="text-xs text-gray-500">{entry.jobNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(entry.clockIn).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.clockOut
                          ? new Date(entry.clockOut).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.breakMinutes} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {entry.status === 'completed' ? `${entry.totalHours.toFixed(2)} hrs` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://maps.google.com/?q=${entry.gpsLatIn},${entry.gpsLonIn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <MapPin className="h-5 w-5" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        entry.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status === 'active' ? (
                          <><Play className="h-3 w-3 mr-1 mt-0.5" /> Active</>
                        ) : (
                          <><Square className="h-3 w-3 mr-1 mt-0.5" /> Complete</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Crew Status View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockCrewMembers.map((member) => {
            const memberEntries = mockTimeEntries.filter(e => e.user === member.name)
            const todayHours = memberEntries.reduce((sum, e) => sum + e.totalHours, 0)
            const isActive = memberEntries.some(e => e.status === 'active')

            return (
              <div key={member.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive ? 'Active' : 'Off'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Today's Hours</span>
                    <span className="font-semibold">{todayHours.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entries</span>
                    <span className="font-semibold">{memberEntries.length}</span>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                      <Clock className="h-4 w-4 mr-2" />
                      Currently working
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
