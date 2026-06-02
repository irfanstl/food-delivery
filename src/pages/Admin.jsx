import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShoppingBag, TrendingUp, 
  Utensils, ClipboardList, CreditCard, Settings, 
  Search, Plus, Filter, MoreVertical, 
  CheckCircle2, XCircle, Clock, Truck, ShieldAlert, Ban, Eye,
  Menu, X
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

  // Form State
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const [statsData, usersData, paymentsData, allRestData] = await Promise.all([
          fetch('/api/admin/stats').then(res => res.ok ? res.json() : null),
          fetch('/api/admin/users').then(res => res.ok ? res.json() : []),
          fetch('/api/admin/payments').then(res => res.ok ? res.json() : []),
          fetch('/api/admin/restaurants/all').then(res => res.ok ? res.json() : [])
        ]);
        setStats(statsData);
        setUsers(usersData);
        setPayments(paymentsData);
        setAllRestaurants(allRestData);
      } catch (err) {
        console.error("Admin data fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/admin/restaurants/${id}/approve`, { method: 'POST' });
      // Update local state to mark it as active
      setAllRestaurants(prev => prev.map(r => r.id === id ? { ...r, isActive: true } : r));
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  // Sidebar Menu Items (same)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'menu', label: 'Menu Control', icon: ClipboardList },
    { id: 'orders', label: 'Order Management', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-mango-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 bg-mango-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 bg-mango-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8f9fa] dark:bg-gray-900 min-h-screen pt-20 transition-colors duration-300">
      {/* Overlay Backdrop for Mobile */}
      {isAdminSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsAdminSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 lg:top-20 left-0 z-50 lg:z-30 w-64 h-full lg:h-[calc(100vh-5rem)] bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col transition-transform duration-300 transform 
          ${isAdminSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header for Mobile Sidebar */}
        <div className="lg:hidden p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
          <span className="font-extrabold text-sm uppercase tracking-widest text-gray-900 dark:text-white">Admin Menu</span>
          <button 
            onClick={() => setIsAdminSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Management</p>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsAdminSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === item.id 
                    ? 'bg-mango-500 text-white shadow-lg shadow-mango-500/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdminSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Open Admin Menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm focus-within:border-mango-500 transition-all">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent outline-none text-sm font-medium w-40 md:w-64 dark:text-white dark:placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {activeTab === 'users' && (
              <button 
                onClick={() => setShowAddUser(true)}
                className="bg-gray-900 dark:bg-mango-500 text-white p-2.5 rounded-xl hover:scale-105 transition-all"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content Views */}
        <div className="text-gray-900 dark:text-gray-100">
          {activeTab === 'dashboard' && <DashboardView stats={stats} />}
          {activeTab === 'users' && <UserManagementView users={users} />}
          {activeTab === 'restaurants' && <RestaurantManagementView allRestaurants={allRestaurants} onApprove={handleApprove} />}
          {activeTab === 'orders' && <OrderManagementView />}
          {activeTab === 'payments' && <PaymentMonitoringView payments={payments} />}
        </div>

        {/* Add User Modal */}
        {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}
      </main>
    </div>
  );
}

// --- Sub-Components ---

function AddUserModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-lg relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Add New Customer</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><XCircle size={24} /></button>
        </div>
        <form className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Name (Optional)</label>
              <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:border-mango-500 font-bold text-sm dark:text-white" placeholder="John Doe" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-200 ml-2">Address 1 (Mandatory) *</label>
              <input type="text" required className="w-full px-5 py-3 rounded-xl border-2 border-mango-100 dark:border-mango-500/30 bg-white dark:bg-gray-900 focus:outline-none focus:border-mango-500 font-bold text-sm dark:text-white" placeholder="House No, Building, Street" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Address 2 (Optional)</label>
              <input type="text" className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:border-mango-500 font-bold text-sm dark:text-white" placeholder="Landmark, Area" />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-mango-500 text-white font-black py-4 rounded-xl shadow-lg shadow-mango-500/20 active:scale-95 transition-all">
              Save Customer Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DashboardView({ stats }) {
  if (!stats) return null;
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', val: stats.orders, icon: ShoppingBag, color: 'text-mango-600 dark:text-mango-400', bg: 'bg-mango-50 dark:bg-mango-900/20' },
          { label: 'Active Users', val: stats.users, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Revenue', val: stats.revenue, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Active Partners', val: stats.restaurants, icon: Utensils, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm group hover:shadow-xl transition-all">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.val}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] shadow-sm p-8 h-64 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 font-bold border-dashed">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p>Live Revenue Analytics</p>
      </div>
    </div>
  );
}

function UserManagementView({ users }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">User</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Address 1</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-black text-gray-900 dark:text-white">{u.name}</div>
                <div className="text-xs text-gray-500 font-medium">{u.email}</div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400">{u.address1}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {u.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Eye size={18} /></button>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Ban size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RestaurantManagementView({ allRestaurants, onApprove }) {
  if (!allRestaurants || allRestaurants.length === 0) {
    return <div className="p-12 text-center text-gray-400 font-bold bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">No restaurants found.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left">
        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Restaurant</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Details</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
          {allRestaurants.map(r => (
            <tr key={r.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-black text-gray-900 dark:text-white">{r.name}</div>
                <div className="text-xs text-gray-500 font-medium">{r.address}</div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="font-bold text-gray-900 dark:text-white">{r.type}</div>
                <div className="text-xs text-gray-500 font-medium">{r.deliveryTime} • {r.deliveryFee}</div>
              </td>
              <td className="px-6 py-4">
                {r.isActive ? (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Live
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {!r.isActive && (
                  <button 
                    onClick={() => onApprove(r.id)}
                    className="px-4 py-2 bg-mango-500 hover:bg-mango-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderManagementView() {
  return <div className="p-12 text-center text-gray-400 font-bold bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">Connect Order API for live tracking</div>;
}

function PaymentMonitoringView({ payments }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#f4f4f4] dark:bg-white rounded-2xl flex items-center justify-center p-3">
             <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Razorpay Integration Active</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">All customer payments are being processed via Razorpay Secure.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all">View Payouts</button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Transaction ID</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Method</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Amount</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {payments.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{p.id}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{p.method}</span>
                </td>
                <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{p.amount}</td>
                <td className="px-6 py-4">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    p.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


