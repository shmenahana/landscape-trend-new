'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users } from 'lucide-react'

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const mockEvents: any[] = []

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-06'))
  const [view, setView] = useState<'week' | 'day'>('week')
  const [showAddModal, setShowAddModal] = useState(false)

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - (view === 'week' ? 7 : 1))
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (view === 'week' ? 7 : 1))
    setCurrentDate(newDate)
  }

  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(day.getDate() + i)
      return day
    })
  }

  const weekDays = getWeekDays()
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM

  const getEventsForDay = (date: Date) => {
    return mockEvents.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule</h1>
            <p className="text-gray-600">Manage crew schedules and job assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                className="btn btn-outline p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="btn btn-outline p-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn btn-outline btn-sm"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('day')}
              className={`btn ${view === 'day' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50 border-r border-gray-200">
            <div className="text-sm font-medium text-gray-500">Time</div>
          </div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`p-4 text-center border-r border-gray-200 ${
                day.toDateString() === new Date().toDateString()
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500">
                {daysOfWeek[day.getDay()].slice(0, 3).toUpperCase()}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                day.toDateString() === new Date().toDateString()
                  ? 'text-green-600'
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-2 border-r border-gray-200 bg-gray-50 text-sm text-gray-600 text-center">
                {hour % 12 || 12}:00 {hour < 12 ? 'AM' : 'PM'}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day).filter(event => {
                  const eventHour = new Date(event.startTime).getHours()
                  return eventHour === hour
                })

                return (
                  <div
                    key={dayIndex}
                    className="p-2 border-r border-gray-100 min-h-[80px] hover:bg-gray-50 cursor-pointer"
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="mb-2 p-2 rounded text-white text-xs"
                        style={{ backgroundColor: event.color }}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="opacity-90">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        <div className="opacity-75 flex items-center mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {event.crew}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Job</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job *
                </label>
                <select className="input">
                  <option>Select a job...</option>
                  <option>JOB-2601-0001 - Smith Residence</option>
                  <option>JOB-2601-0002 - Commercial Plaza</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crew *
                </label>
                <select className="input">
                  <option>Select a crew...</option>
                  <option>Crew A (3 members)</option>
                  <option>Crew B (4 members)</option>
                  <option>Crew C (2 members)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input type="date" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input type="time" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input type="time" className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea className="input" rows={3}></textarea>
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
                  Schedule Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
