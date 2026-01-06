'use client'

import { Settings, User, DollarSign, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and business settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-1">
              <a href="#profile" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-green-50 text-green-700">
                <User className="h-5 w-5 mr-3" />
                Profile
              </a>
              <a href="#pricing" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50">
                <DollarSign className="h-5 w-5 mr-3" />
                Pricing & Rates
              </a>
              <a href="#notifications" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50">
                <Bell className="h-5 w-5 mr-3" />
                Notifications
              </a>
              <a href="#security" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50">
                <Shield className="h-5 w-5 mr-3" />
                Security
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="card p-6" id="profile">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input type="text" className="input" defaultValue="LandscapePro Services" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input type="text" className="input" defaultValue="Admin User" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input type="email" className="input" defaultValue="admin@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input type="tel" className="input" defaultValue="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address
                </label>
                <input type="text" className="input" placeholder="Street address" />
              </div>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </form>
          </div>

          {/* Pricing Settings */}
          <div className="card p-6" id="pricing">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Pricing & Rates</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Labor Rate ($/hour)
                  </label>
                  <input type="number" className="input" defaultValue="45" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overhead Percentage (%)
                  </label>
                  <input type="number" className="input" defaultValue="15" step="0.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Margin (%)
                  </label>
                  <input type="number" className="input" defaultValue="20" step="0.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input type="number" className="input" defaultValue="6.5" step="0.1" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Save Pricing
              </button>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="card p-6" id="notifications">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="ml-3 text-sm text-gray-700">Email notifications for new estimates</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="ml-3 text-sm text-gray-700">Email notifications for overdue invoices</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="ml-3 text-sm text-gray-700">Email notifications for job completions</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="ml-3 text-sm text-gray-700">Daily summary emails</span>
              </label>
              <button type="submit" className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card p-6" id="security">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input type="password" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input type="password" className="input" />
              </div>
              <button type="submit" className="btn btn-primary">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
