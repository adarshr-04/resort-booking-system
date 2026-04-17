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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setSelectedGuest(null)} />
            <div className="relative w-full max-w-xl bg-background border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <header className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center text-sm font-light">
                    {selectedGuest.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-light tracking-widest uppercase">Guest Dossier</h2>
                    <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Ref #{selectedGuest.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedGuest(null)} className="text-muted-foreground hover:text-foreground">
                  <EyeOff className="w-5 h-5" />
                </button>
              </header>
              <div className="p-8 space-y-8">
                <section>
                  <label className="text-[10px] tracking-[0.25em] uppercase text-accent font-bold block mb-4 border-b border-border pb-2">Personal Information</label>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Full Email</p>
                      <p className="text-sm font-medium">{selectedGuest.email}</p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Contact Number</p>
                      <p className="text-sm font-medium">{selectedGuest.phone || 'Not Provided'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] tracking-[0.25em] uppercase text-accent font-bold block mb-4 border-b border-border pb-2">Identity & Verification</label>
                  {getGuestIdentity(selectedGuest.id) ? (
                    <div className="bg-secondary/30 p-4 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] tracking-widest uppercase font-bold text-muted-foreground italic">Encrypted Document</span>
                        <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase tracking-widest ${
                          getGuestIdentity(selectedGuest.id)?.is_verified ? 'border-accent text-accent' : 'border-yellow-500 text-yellow-600'
                        }`}>
                          {getGuestIdentity(selectedGuest.id)?.is_verified ? 'Verified' : 'Pending Review'}
                        </span>
                      </div>
                      <p className="text-xs font-mono tracking-[0.2em] text-foreground">
                        {getGuestIdentity(selectedGuest.id)?.decrypted_aadhaar || '•••• •••• ••••'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No identity document has been uploaded for this guest yet.</p>
                  )}
                </section>

                <div className="pt-4 flex justify-end">
                  <button onClick={() => setSelectedGuest(null)} className="px-10 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-primary/90 transition-all">
                    Close Profile
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
                    onClick={() => setSelectedGuest(guest)}
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
