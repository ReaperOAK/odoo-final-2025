import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-gradient-to-br from-brand-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Rent Equipment
            <span className="text-brand block">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Access professional equipment for your projects. From cameras to laptops, 
            find everything you need with transparent pricing and instant availability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn-primary text-lg px-8 py-3">
              Browse Products
            </Link>
            <Link to="/register" className="btn-secondary text-lg px-8 py-3">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Availability</h3>
              <p className="text-gray-600">Real-time availability checking prevents double bookings</p>
            </div>
            <div className="text-center">
              <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600">Clear hourly, daily, and weekly rates with no hidden fees</p>
            </div>
            <div className="text-center">
              <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-brand text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Professional equipment with full insurance coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
