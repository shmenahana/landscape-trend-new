import Link from 'next/link'
import { ArrowRight, Calculator, Clock, TrendingUp, Users, Calendar, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">LandscapePro</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-green-600">Features</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-green-600">Pricing</Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-green-600">Login</Link>
          </nav>
          <Link href="/auth/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Job Costing & Estimating<br />
          <span className="text-green-600">Built for Landscape Pros</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track every job in real-time. Know your numbers. Grow your margins.
          Complete business management software for landscape contractors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-3">
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="/dashboard" className="btn btn-outline text-lg px-8 py-3">
            View Demo
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Run Your Business
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calculator className="h-10 w-10 text-green-600" />}
            title="Live Job Costing"
            description="See estimated vs actual hours and costs in real-time. Instantly spot over or under-budget jobs."
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-green-600" />}
            title="Fast Estimating"
            description="Build estimates in minutes with drag-and-drop templates. Automatic overhead recovery and profit margins."
          />
          <FeatureCard
            icon={<Clock className="h-10 w-10 text-green-600" />}
            title="Time Tracking"
            description="Crews track time on their phones with GPS verification. Automatic payroll and job costing integration."
          />
          <FeatureCard
            icon={<Calendar className="h-10 w-10 text-green-600" />}
            title="Smart Scheduling"
            description="Drag-and-drop calendar with color-coding. See where crews are going today, tomorrow, or next week."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-green-600" />}
            title="CRM & Proposals"
            description="Manage customers and leads. Send professional digital proposals with e-signature capability."
          />
          <FeatureCard
            icon={<TrendingUp className="h-10 w-10 text-green-600" />}
            title="Analytics Dashboard"
            description="Know exactly what you made on every job. Track profit margins, identify trends, grow your business."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-green-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-xl">Accurate Job Costing</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10min</div>
              <div className="text-xl">Average Estimate Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">$50K+</div>
              <div className="text-xl">Avg. Annual Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Know Your Numbers?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join hundreds of landscape contractors who trust LandscapePro
        </p>
        <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-3">
          Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 LandscapePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
