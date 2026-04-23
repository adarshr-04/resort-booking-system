import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { Mail, Phone, Search, ShieldCheck, ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function AdminGuests() {
  const [guests, setGuests] = useState<any[]>([])
  const [identities, setIdentities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAadhaar, setShowAadhaar] = useState<number | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null)
  const [guestProfile, setGuestProfile] = useState<any | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'bookings' | 'requests' | 'reviews'>('bookings')

  useEffect(() => {
    async function loadData() {
      try {
        const [guestData, identityData] = await Promise.all([
          api.getUsers(),
          api.getIdentities()
        ])
        setGuests(guestData)
        setIdentities(identityData)
      } catch (err) {
        console.error('Failed to load guest data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSelectGuest = async (guest: any) => {
    setSelectedGuest(guest)
    setProfileLoading(true)
    setGuestProfile(null)
    setActiveTab('bookings')
    try {
      const profile = await api.getGuestProfile(guest.email)
      setGuestProfile(profile)
    } catch (err) {
      console.error('Failed to load guest profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleVerify = async (identityId: number) => {
    try {
      await api.verifyIdentity(identityId)
      const freshIdentities = await api.getIdentities()
      setIdentities(freshIdentities)
    } catch (err) {
      console.error('Verification failed:', err)
    }
  }

  const getGuestIdentity = (userId: number) => {
    return identities.find(id => id.user === userId)
  }

  const filteredGuests = guests.filter(g => 
    g.email.toLowerCase().includes(search.toLowerCase()) || 
    (g.phone && g.phone.includes(search))
  )

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Guest Relations</h1>
            <p className="text-muted-foreground text-sm tracking-wide">Maintain a database of resort visitors and their encrypted identities.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search Guests..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-accent w-64" 
            />
          </div>
        </header>

        {selectedGuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setSelectedGuest(null)} />
            <div className="relative w-full max-w-4xl bg-background border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-300 my-auto">
              <header className="p-8 border-b border-border flex items-center justify-between bg-secondary/20">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-xl font-light">
                    {selectedGuest.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-light tracking-widest uppercase">Guest Journey History</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Ref #{selectedGuest.id} · {selectedGuest.email}</p>
                      {guestProfile?.profile && (
                        <span className="text-[9px] px-2 py-0.5 bg-accent text-white font-bold uppercase tracking-widest">
                          {guestProfile.profile.loyalty_level} Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedGuest(null)} className="text-muted-foreground hover:text-foreground">
                  <EyeOff className="w-6 h-6" />
                </button>
              </header>

              <div className="p-8">
                {profileLoading ? (
                  <div className="py-20 flex justify-center">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-3 gap-10">
                    {/* Left: Summary Stats */}
                    <div className="space-y-6">
                      <div className="bg-secondary/20 border border-border p-5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-4">Engagement Summary</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-2xl font-light tracking-tight">₹ {guestProfile?.profile.total_spent.toLocaleString()}</p>
                            <p className="text-[9px] uppercase tracking-widest text-accent font-bold mt-1">Total Contribution</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div>
                              <p className="text-lg font-light">{guestProfile?.profile.total_stays}</p>
                              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Stays</p>
                            </div>
                            <div>
                              <p className="text-lg font-light">{guestProfile?.profile.total_nights}</p>
                              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Nights</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <section>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-bold block mb-3">Identity Document</label>
                        {getGuestIdentity(selectedGuest.id) ? (
                          <div className="bg-secondary/10 p-4 border border-border border-dashed">
                            <div className="flex items-center justify-between mb-2">
                              <ShieldCheck className="w-4 h-4 text-accent" />
                              <span className="text-[9px] text-accent font-bold uppercase">Verified Aadhaar</span>
                            </div>
                            <p className="text-xs font-mono tracking-widest opacity-80">
                              {getGuestIdentity(selectedGuest.id)?.decrypted_aadhaar || '•••• •••• ••••'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] italic text-muted-foreground">No identity on file.</p>
                        )}
                      </section>
                    </div>

                    {/* Right: History Tabs */}
                    <div className="lg:col-span-2">
                      <div className="flex gap-6 border-b border-border mb-6">
                        {(['bookings', 'requests', 'reviews'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-[10px] uppercase tracking-widest font-bold transition-all ${
                              activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'bookings' && (
                          <div className="space-y-4">
                            {guestProfile?.bookings.length === 0 && <p className="text-xs italic text-muted-foreground py-10">No booking records found.</p>}
                            {guestProfile?.bookings.map((b: any) => (
                              <div key={b.id} className="p-4 border border-border bg-background hover:bg-secondary/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal">{b.room_name}</h4>
                                  <span className={`text-[8px] px-2 py-0.5 border font-bold uppercase ${
                                    b.status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-accent text-accent'
                                  }`}>{b.status}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(b.check_in).toLocaleDateString()} — {new Date(b.check_out).toLocaleDateString()} ({b.total_days} nights)
                                </p>
                                <p className="text-[10px] font-mono mt-2 text-accent">₹ {Number(b.total_price).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeTab === 'requests' && (
                          <div className="space-y-4">
                            {guestProfile?.requests.length === 0 && <p className="text-xs italic text-muted-foreground py-10">No service requests found.</p>}
                            {guestProfile?.requests.map((r: any) => (
                              <div key={r.id} className="p-4 border border-border bg-background">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9px] px-2 py-0.5 bg-secondary text-muted-foreground font-bold uppercase tracking-widest">{r.request_type}</span>
                                  <span className="text-[9px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs italic text-charcoal mb-2">"{r.description}"</p>
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${
                                  r.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>● {r.status}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeTab === 'reviews' && (
                          <div className="space-y-4">
                            {guestProfile?.reviews.length === 0 && <p className="text-xs italic text-muted-foreground py-10">Guest hasn't left any reviews yet.</p>}
                            {guestProfile?.reviews.map((rv: any) => (
                              <div key={rv.id} className="p-4 border border-border bg-background">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-xs ${i < rv.rating ? 'text-accent' : 'text-muted-foreground/30'}`}>★</span>
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground uppercase">{rv.room_name}</span>
                                </div>
                                <p className="text-xs italic text-charcoal mb-1">"{rv.comment}"</p>
                                <p className="text-[9px] text-muted-foreground">{new Date(rv.created_at).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-border flex justify-end">
                  <button onClick={() => setSelectedGuest(null)} className="px-10 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-primary/90 transition-all">
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const identity = getGuestIdentity(guest.id)
              return (
                <div key={guest.id} className="bg-background border border-border p-6 shadow-sm group hover:border-accent transition-all duration-300 relative overflow-hidden">
                  {identity?.is_verified && (
                    <div className="absolute top-0 right-0 p-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  
                  <div className="w-12 h-12 bg-secondary flex items-center justify-center text-lg font-light mb-6">
                    {guest.email[0].toUpperCase()}
                  </div>
                  
                  <h3 className="text-sm font-medium tracking-wide mb-1 truncate">{guest.email}</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Guest Ref #{guest.id}</p>
                    {identity ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${identity.is_verified ? 'border-accent text-accent' : 'border-yellow-500/50 text-yellow-600'} flex items-center gap-1 uppercase tracking-tighter`}>
                        {identity.is_verified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {identity.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground uppercase tracking-tighter">No ID</span>
                    )}
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-border/50 mb-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{guest.phone || 'No Phone'}</span>
                    </div>
                  </div>

                  {identity && !identity.is_verified && (
                    <button 
                      onClick={() => handleVerify(identity.id)}
                      className="w-full py-3 bg-accent text-white text-[10px] tracking-widest uppercase hover:bg-accent/90 transition-all font-bold mb-3"
                    >
                      Verify Document
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleSelectGuest(guest)}
                    className="w-full py-3 border border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:bg-secondary transition-all font-bold"
                  >
                    View full Profile
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
