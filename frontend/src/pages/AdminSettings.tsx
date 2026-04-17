import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Globe, Bell, Shield, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    resort_name: '',
    contact_email: '',
    base_currency: 'INR',
    notifications_enabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getSettings()
        if (data.id) {
          setSettings(data)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(settings.id, settings)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 flex justify-center translate-y-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 md:px-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Resort Identity & Core Configuration</h1>
            <p className="text-muted-foreground text-sm tracking-wide italic">Configure the core parameters that define the Coorg Pristine Woods digital identity and guest communications.</p>
          </div>
          {showSuccess && (
            <div className="flex items-center gap-2 text-accent text-xs tracking-widest uppercase font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              Changes Saved
            </div>
          )}
        </header>

        <div className="space-y-8">
          {/* General Info */}
          <section className="bg-background border border-border p-8 shadow-sm">
            <h2 className="text-sm tracking-[0.2em] uppercase text-accent mb-8 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              General Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Resort Name</label>
                  <input 
                    type="text" 
                    value={settings.resort_name}
                    onChange={(e) => setSettings({ ...settings, resort_name: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-accent" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Base Currency</label>
                  <select 
                    value={settings.base_currency}
                    onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Primary Contact Email</label>
                  <input 
                    type="email" 
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-accent" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Check-in Policy</label>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">System default: 15:00 GMT+1. This is displayed on all guest booking confirmations.</p>
                </div>
              </div>
            </div>
            <div className="mt-12 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-background border border-border p-8 shadow-sm">
              <h2 className="text-sm tracking-[0.2em] uppercase text-accent mb-6 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <span className="text-xs">Global Booking Alerts</span>
                  <button 
                    onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                    className={`w-8 h-4 rounded-full relative transition-colors ${settings.notifications_enabled ? 'bg-accent' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.notifications_enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border/50 opacity-50">
                  <span className="text-xs italic">System Logging</span>
                  <span className="text-[9px] tracking-widest uppercase font-bold text-accent">Always On</span>
                </div>
              </div>
            </section>

            <section className="bg-background border border-border p-8 shadow-sm">
              <h2 className="text-sm tracking-[0.2em] uppercase text-accent mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                System Security
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Aadhaar Encryption", val: "Fernet AES-256" },
                  { label: "Two-Factor Auth", val: "Enforced" },
                  { label: "Admin IP Lock", val: "Inactive" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between pb-3 border-b border-border/50">
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-medium">{item.val}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
