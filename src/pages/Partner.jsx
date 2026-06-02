import { useState } from 'react';
import { Store, MapPin, Clock, DollarSign, Upload, CheckCircle, Navigation } from 'lucide-react';

export default function Partner() {
  const [formData, setFormData] = useState({
    name: '', type: '', deliveryTime: '', deliveryFee: '', img: '',
    addressLine1: '', addressLine2: '', addressLine3: '', city: '', zip: '', coordinates: ''
  });
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          coordinates: `${position.coords.latitude}, ${position.coords.longitude}`
        }));
        setIsLocating(false);
      },
      () => {
        alert('Unable to retrieve your location. Please check your browser permissions.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    // Concatenate address for backend
    const fullAddress = [
      formData.addressLine1,
      formData.addressLine2,
      formData.addressLine3,
      formData.city,
      formData.zip,
      formData.coordinates ? `(GPS: ${formData.coordinates})` : ''
    ].filter(Boolean).join(', ');
    const payload = { ...formData, address: fullAddress };

    try {
      const response = await fetch('http://localhost:5001/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({
          name: '', type: '', deliveryTime: '', deliveryFee: '', img: '',
          addressLine1: '', addressLine2: '', addressLine3: '', city: '', zip: '', coordinates: ''
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Error adding restaurant:", error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4 dark:text-white">Application Received!</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">Your restaurant registration has been submitted and is currently pending admin approval. Once approved, it will be visible to customers.</p>
        <button
          onClick={() => { setStatus('idle'); setActiveTab('details'); }}
          className="bg-mango-500 hover:bg-mango-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Add Another Restaurant
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Partner with <span className="text-mango-500">MangoBite</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Join thousands of restaurants reaching more customers every day. Fill out the form below to list your restaurant on our platform.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-center font-bold text-sm sm:text-base transition-colors ${activeTab === 'details' ? 'text-mango-600 border-b-2 border-mango-500 bg-mango-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            1. Restaurant Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`flex-1 py-4 text-center font-bold text-sm sm:text-base transition-colors ${activeTab === 'address' ? 'text-mango-600 border-b-2 border-mango-500 bg-mango-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            2. Location & Address
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12">

          <div className="space-y-8">

            {activeTab === 'details' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Restaurant Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                      placeholder="e.g. The Mango Grove"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Type/Cuisine */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cuisine Type</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                        placeholder="e.g. Healthy • Vegan"
                      />
                    </div>
                  </div>

                  {/* Delivery Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Est. Delivery Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleChange}
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                        placeholder="e.g. 15-25 min"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Delivery Fee */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Delivery Fee</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="deliveryFee"
                        value={formData.deliveryFee}
                        onChange={handleChange}
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                        placeholder="e.g. Free or ₹2.50"
                      />
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Restaurant Image URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        name="img"
                        value={formData.img}
                        onChange={handleChange}
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('address')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                >
                  Continue to Address &rarr;
                </button>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Restaurant Location</h3>
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={isLocating}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <Navigation size={16} className={isLocating ? "animate-pulse" : ""} />
                    {isLocating ? 'Locating...' : 'Use GPS Location'}
                  </button>
                </div>

                {formData.coordinates && (
                  <div className="bg-green-50 text-green-700 text-sm font-bold p-3 rounded-xl mb-4 border border-green-200 flex items-center gap-2">
                    <CheckCircle size={16} /> GPS Location captured: {formData.coordinates}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                        placeholder="Street address, P.O. box, company name"
                      />
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  {/* Address Line 3 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Line 3 <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      name="addressLine3"
                      value={formData.addressLine3}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                      placeholder="Landmark or additional info"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                      placeholder="e.g. New York"
                    />
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zip/Postal Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mango-500 focus:border-transparent transition-all"
                      placeholder="e.g. 10001"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                    There was an error saving your restaurant. Please try again.
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-2/3 bg-mango-500 hover:bg-mango-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-mango-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? 'Submitting...' : 'Register Restaurant'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}
