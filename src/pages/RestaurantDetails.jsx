import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Clock, ArrowLeft, Flame, Plus, Share,
  MessageSquare, Map as MapIcon, CalendarCheck, Image as ImageIcon,
  BookOpen, ShoppingBag, Check, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'menu', label: 'Menu', icon: <BookOpen size={14} /> },
  { id: 'order', label: 'Order Online', icon: <ShoppingBag size={14} /> },
  { id: 'photos', label: 'Photos', icon: <ImageIcon size={14} /> },
  { id: 'reviews', label: 'Reviews', icon: <MessageSquare size={14} /> },
  { id: 'info', label: 'Info', icon: <MapPin size={14} /> },
];

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [copied, setCopied] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const tabRefs = useRef({});
  const tabSectionRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [restRes, revRes, photoRes] = await Promise.all([
          fetch(`/api/restaurants/${id}`),
          fetch(`/api/restaurants/${id}/reviews`),
          fetch(`/api/restaurants/${id}/photos`),
        ]);
        setRestaurant(await restRes.json());
        setReviews(await revRes.json());
        setPhotos(await photoRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      tabSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { name: 'Anonymous' };
      const res = await fetch(`/api/restaurants/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setNewReviewComment('');
        setNewReviewRating(5);
        toast.success('Review added successfully!');
      } else {
        toast.error('Failed to add review');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white animate-pulse pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-gray-200 rounded-full mb-8"></div>
          <div className="h-12 w-2/3 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-full bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded-full mb-8"></div>
          <div className="w-full h-96 bg-gray-200 rounded-[2rem] mb-12"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) return (
    <div className="text-center py-40 text-2xl font-bold bg-white min-h-screen pt-40">Restaurant not found!</div>
  );

  return (
    <div className="bg-white min-h-screen pb-20 pt-28 sm:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-mango-600 transition-colors font-bold mb-6">
            <ArrowLeft size={20} /> Back to restaurants
          </Link>

          {/* Name & Description */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {restaurant.name}
              </h1>
              <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-3xl mb-6">
                Discover the authentic taste of {restaurant.type.toLowerCase()}, prepared fresh and delivered piping hot.
                Experience a culinary journey filled with passion, premium ingredients, and a touch of our signature twist.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-green-200">
                  <Star size={16} className="fill-green-700" /> {restaurant.rating}
                </span>
                <button onClick={() => switchTab('reviews')} className="text-gray-500 font-bold underline cursor-pointer hover:text-gray-900 transition-colors">
                  {restaurant.reviews} Reviews
                </button>
                <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-gray-300 mx-2"></span>
                <span className="text-gray-500 font-bold flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin size={16} className="text-gray-400" /> Approx. 2.4 km away
                </span>
              </div>
            </div>
            <div className="bg-mango-50 border border-mango-100 rounded-3xl p-6 text-right w-full md:w-auto mt-2 md:mt-0 shadow-sm shrink-0">
              <div className="text-sm text-mango-800 font-bold mb-1">Standard Delivery Fee</div>
              <div className="text-4xl font-extrabold text-mango-600">{restaurant.deliveryFee}</div>
            </div>
          </div>
        </div>

        {/* Full Image */}
        <div className="w-full h-[350px] sm:h-[450px] lg:h-[550px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 mb-8 relative group bg-gray-100">
          <img
            src={restaurant.img}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
          />
          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-xl font-bold text-gray-900 shadow-xl flex items-center gap-2 border border-white/40">
            <Clock size={18} className="text-mango-500" /> Opens till 11:30 PM
          </div>
        </div>

        {/* Four Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <a
            href="https://www.google.com/maps?sca_esv=27fdc1d65c2ac978&rlz=1C1GCEA_enIN1152IN1152&sxsrf=ANbL-n5agvlSCwiDsJllgxPagWQQmF0STw:1776436288007&biw=1920&bih=945&gs_lp=Egxnd3Mtd2l6LXNlcnAiD3NoYXdhcm1hIGtpbmcgYSoCCAAyDhAuGIAEGMcBGI4FGK8BMgUQABiABDILEC4YgAQYxwEYrwEyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDILEC4YgAQYxwEYrwEyBRAAGIAEMh0QLhiABBjHARiOBRivARiXBRjcBBjeBBjgBNgBAkinI1D1AVjvBHABeAGQAQCYAfUFoAGgB6oBBzAuMS42LTG4AQHIAQD4AQGYAgSgApkQwgIKEAAYsAMY1gQYR8ICDRAAGLADGNYEGEcYyQPCAg4QABiABBiwAxiSAxiKBcICFxAuGLADGNgCGLgGGMgDGNoGGNwG2AEBwgIXEC4YsAMYuAYY2AIYyAMY2gYY3AbYAQHCAgoQABiABBhDGIoFwgINEAAYgAQYQxjJAxiKBcICCBAAGIAEGJIDmAMAiAYBkAYNugYECAEYGboGBggCEAEYFJIHCTEuMS41LTEuMaAHmSeyBwcwLjEuNS0xuAfEB8IHCTAuMS4wLjIuMcgHM4AIAA&um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KZnhKvzlucI7MVuXshQzIZWF&daddr=Shop+No+7,+ABC+Junction+Apartments,+Dr+Babasaheb+Ambedkar+Rd,+near+Akurdi+Railway+Station,+Pradhikaran,+Nigdi,+Pimpri-Chinchwad,+Maharashtra+411044"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white hover:bg-mango-50 border border-gray-100 hover:border-mango-200 text-gray-700 hover:text-mango-700 rounded-lg h-[30px] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group"
          >
            <MapIcon size={14} className="text-gray-500 group-hover:text-mango-500 transition-colors" />
            <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wide">Direction</span>
          </a>

          <button
            onClick={() => switchTab('reviews')}
            className={`flex items-center justify-center gap-2 border rounded-lg h-[30px] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group
              ${activeTab === 'reviews' ? 'bg-mango-500 border-mango-400 text-white' : 'bg-white border-gray-100 hover:bg-mango-50 hover:border-mango-200 text-gray-700 hover:text-mango-700'}`}
          >
            <MessageSquare size={14} className={activeTab === 'reviews' ? 'text-white' : 'text-gray-500 group-hover:text-mango-500 transition-colors'} />
            <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wide">Reviews</span>
          </button>

          {/* Share — copies URL */}
          <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-2 border rounded-lg h-[30px] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group
              ${copied ? 'bg-green-500 border-green-400 text-white' : 'bg-white border-gray-100 hover:bg-mango-50 hover:border-mango-200 text-gray-700 hover:text-mango-700'}`}
          >
            {copied ? <Check size={14} className="text-white" /> : <Share size={14} className="text-gray-500 group-hover:text-mango-500 transition-colors" />}
            <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wide">
              {copied ? 'Copied!' : 'Share'}
            </span>
          </button>

          <button className="flex items-center justify-center gap-2 bg-mango-500 hover:bg-mango-600 border border-mango-400 text-white rounded-lg h-[30px] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group">
            <CalendarCheck size={14} className="text-white" />
            <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wide">Book</span>
          </button>
        </div>

        {/* Sliding Tab Nav */}
        <div ref={tabSectionRef} className="relative mb-8 scroll-mt-24">
          <div className="flex gap-0 border-b border-gray-100 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all duration-300 relative whitespace-nowrap shrink-0
                  ${activeTab === tab.id ? 'text-mango-600' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-mango-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Menu (Restaurant's physical menu) ── */}
        {activeTab === 'menu' && (
          <div className="animate-fadeIn">
            <p className="text-gray-400 text-sm font-medium mb-6">Browse through our full restaurant menu</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {Array.from(new Set((restaurant.menu || []).map(item => item.category || 'Specials'))).map((section) => (
                <div key={section} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-5 bg-mango-500 rounded-full inline-block"></span>
                    {section}
                  </h3>
                  <div className="space-y-3">
                    {(restaurant.menu || []).filter(item => (item.category || 'Specials') === section).map((item) => (
                      <Link to={`/food/${item.id}`} key={item.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0 hover:bg-white p-2 rounded-lg transition-colors cursor-pointer group">
                        <span className="font-semibold text-gray-700 group-hover:text-mango-600 transition-colors">{item.name}</span>
                        <span className="font-extrabold text-gray-900">{item.price}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Order Online ── */}
        {activeTab === 'order' && (
          <div className="animate-fadeIn">
            <p className="text-gray-400 text-sm font-medium mb-6">Add items to your cart and order directly</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {restaurant.menu?.map((item) => (
                <Link to={`/food/${item.id}`} key={item.id} className="group flex gap-4 bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-mango-100/50 transition-all duration-300 cursor-pointer">
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden shrink-0 bg-mango-50">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col justify-between py-1 w-full">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{item.name}</h3>
                      <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <Clock size={14} /> {item.time} • {item.cal}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xl font-extrabold text-gray-900">{item.price}</span>
                      <button 
                        className="bg-mango-50 text-mango-600 p-2.5 rounded-full hover:bg-mango-500 hover:text-white transition-colors" 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/cart', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: item.id}) });
                            if (res.ok) {
                              window.dispatchEvent(new Event('navDataUpdated'));
                              toast.success('Added to Cart!');
                            } else {
                              toast.error('Session expired. Please log out and log in again.');
                            }
                          } catch (e) {
                            toast.error('Failed to add to cart');
                          }
                        }}
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Photos ── */}
        {activeTab === 'photos' && (
          <div className="animate-fadeIn">
            <p className="text-gray-400 text-sm font-medium mb-6">{photos.length} photos from the restaurant</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-zoom-in">
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-sm font-bold">{photo.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Reviews ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex gap-6 items-center bg-mango-50 border border-mango-100 rounded-3xl p-6 mb-6 shadow-sm">
              <div className="text-center shrink-0">
                <div className="text-6xl font-extrabold text-mango-600 leading-none">{restaurant.rating}</div>
                <div className="flex justify-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} className={s <= Math.round(restaurant.rating) ? 'text-mango-500 fill-mango-500' : 'text-gray-300 fill-gray-200'} />
                  ))}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1">{restaurant.reviews} Reviews</div>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 w-4">{star}</span>
                    <Star size={12} className="text-mango-400 fill-mango-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mango-400 rounded-full transition-all duration-700"
                        style={{ width: star === 5 ? '70%' : star === 4 ? '20%' : '5%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Review Form */}
            <form onSubmit={submitReview} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
              <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    type="button" 
                    key={star} 
                    onClick={() => setNewReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star size={24} className={star <= newReviewRating ? 'text-mango-500 fill-mango-500' : 'text-gray-300 fill-gray-200'} />
                  </button>
                ))}
              </div>
              <textarea
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-mango-500/20 focus:border-mango-500 transition-all resize-none mb-4"
                rows="3"
                required
              />
              <button 
                type="submit" 
                disabled={isSubmittingReview || !newReviewComment.trim()}
                className="bg-mango-600 hover:bg-mango-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>

            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-mango-100 text-mango-700 font-extrabold text-lg flex items-center justify-center shrink-0">
                      {review.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{review.name}</div>
                      <div className="text-xs text-gray-400 font-medium">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={13} className="text-mango-500 fill-mango-500" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Info ── */}
        {activeTab === 'info' && (
          <div className="grid sm:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xl text-gray-900 mb-4">Restaurant Details</h3>
              <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-gray-50 pb-3">
                <span className="font-bold text-gray-800">Cuisine Type</span>
                <span>{restaurant.type}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-gray-50 pb-3">
                <span className="font-bold text-gray-800">Delivery Time</span>
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-gray-50 pb-3">
                <span className="font-bold text-gray-800">Delivery Fee</span>
                <span className="text-mango-600 font-bold">{restaurant.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span className="font-bold text-gray-800">Rating</span>
                <span className="flex items-center gap-1 text-green-700 font-bold">
                  <Star size={14} className="fill-green-700" />{restaurant.rating}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-xl text-gray-900 mb-4">Opening Hours</h3>
              <div className="space-y-3 text-sm">
                {['Monday – Friday', 'Saturday', 'Sunday'].map((day, i) => (
                  <div key={day} className="flex justify-between font-medium text-gray-600">
                    <span className="font-bold text-gray-800">{day}</span>
                    <span>{i === 2 ? '10:00 AM – 9:00 PM' : '9:00 AM – 11:30 PM'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
