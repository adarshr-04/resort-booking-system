const API_BASE = '/api'

export interface User {
  id: number
  email: string
  phone?: string
  address?: string
  is_staff: boolean
}

export interface RoomImage {
  id: number
  image: string
  alt_text?: string
}

export interface Amenity {
  id: number
  name: string
  icon?: string
}

export interface Room {
  id: number
  name: string
  description: string
  price_per_day: number
  price_per_night: number
  capacity: number
  is_available: boolean
  is_featured: boolean
  images: RoomImage[]
  amenities: Amenity[]
}

export interface Booking {
  id: number
  user: number
  user_name?: string
  user_email?: string
  user_phone?: string
  room: number
  room_name?: string
  check_in: string
  check_out: string
  guests: number
  total_days: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export interface Experience {
  id: number
  name: string
  description: string
  price: string
  duration: string
  image_url: string
}

export interface ServiceRequest {
  id: number
  room: number
  request_type: string
  request_type_display: string
  experience?: number
  description: string
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  guest_email: string
  is_verified: boolean
  created_at: string
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    // Django REST Framework often returns errors as an object: { "field_name": ["error message"] }
    // Or a single "detail" field
    const errorMessage = error.detail ||
      (Object.values(error).flat().join(' ')) ||
      `HTTP error! status: ${response.status}`
    throw new Error(errorMessage)
  }
  if (response.status === 204) return null
  return response.json()
}

function getHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    const data = await handleResponse(await fetch(`${API_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }))
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  // Unified Login (OTP for everyone)
  async loginRequest(credentials: { email: string; password: string }) {
    return handleResponse(await fetch(`${API_BASE}/auth/login-request/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }))
  },

  async loginVerify(data: { email: string; otp: string }) {
    return handleResponse(await fetch(`${API_BASE}/auth/login-verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }))
  },

  async tokenLogin(token: string) {
    return handleResponse(await fetch(`${API_BASE}/auth/token-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }))
  },

  async processBookingAction(token: string) {
    return handleResponse(await fetch(`${API_BASE}/bookings/action/?token=${token}`))
  },

  // Verified Registration
  async registerRequest(userData: any) {
    return handleResponse(await fetch(`${API_BASE}/auth/register-request/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }))
  },

  async registerVerify(data: { email: string; otp: string }) {
    return handleResponse(await fetch(`${API_BASE}/auth/register-verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }))
  },

  async register(userData: any) {
    return handleResponse(await fetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }))
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  // Rooms
  async getRooms() {
    return handleResponse(await fetch(`${API_BASE}/rooms/`))
  },

  async getRoom(id: number) {
    return handleResponse(await fetch(`${API_BASE}/rooms/${id}/`))
  },

  async createRoom(roomData: any) {
    return handleResponse(await fetch(`${API_BASE}/rooms/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(roomData),
    }))
  },

  async updateRoom(id: number, roomData: any) {
    return handleResponse(await fetch(`${API_BASE}/rooms/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(roomData),
    }))
  },

  async deleteRoom(id: number) {
    return handleResponse(await fetch(`${API_BASE}/rooms/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    }))
  },

  async getRoomAvailability(id: number): Promise<{check_in: string; check_out: string}[]> {
    return handleResponse(await fetch(`${API_BASE}/rooms/${id}/availability/`, {
      headers: getHeaders(),
    }))
  },

  // Bookings
  async getMyBookings() {
    return handleResponse(await fetch(`${API_BASE}/bookings/`, {
      headers: getHeaders(),
    }))
  },

  async createBooking(bookingData: { room: number; check_in: string; check_out: string; guests: number }) {
    return handleResponse(await fetch(`${API_BASE}/bookings/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    }))
  },

  async updateBookingStatus(id: number, status: string) {
    return handleResponse(await fetch(`${API_BASE}/bookings/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    }))
  },

  async getCurrentUser(): Promise<User> {
    return handleResponse(await fetch(`${API_BASE}/users/me/`, {
      headers: getHeaders(),
    }))
  },

  async getUsers(): Promise<User[]> {
    return handleResponse(await fetch(`${API_BASE}/users/`, {
      headers: getHeaders(),
    }))
  },

  async getUsersBookings(): Promise<Booking[]> {
    return handleResponse(await fetch(`${API_BASE}/bookings/`, {
      headers: getHeaders(),
    }))
  },

  // Settings
  async getSettings() {
    const data = await handleResponse(await fetch(`${API_BASE}/settings/`, {
      headers: getHeaders(),
    }))
    return data[0] || {}
  },

  async updateSettings(id: number, settingsData: any) {
    return handleResponse(await fetch(`${API_BASE}/settings/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData),
    }))
  },

  // Identities
  async getIdentities() {
    return handleResponse(await fetch(`${API_BASE}/user-identities/`, {
      headers: getHeaders(),
    }))
  },

  async verifyIdentity(id: number) {
    return handleResponse(await fetch(`${API_BASE}/user-identities/${id}/verify/`, {
      method: 'POST',
      headers: getHeaders(),
    }))
  },

  // Reviews
  async getReviews() {
    return handleResponse(await fetch(`${API_BASE}/reviews/`, {
      headers: getHeaders(),
    }))
  },

  // Service Requests
  async getServiceRequests() {
    return handleResponse(await fetch(`${API_BASE}/service-requests/`, {
      headers: getHeaders(),
    }))
  },

  async createServiceRequest(requestData: { room: number; request_type: string; experience?: number; description?: string; guest_email: string }) {
    return handleResponse(await fetch(`${API_BASE}/service-requests/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestData),
    }))
  },

  async verifyServiceOtp(id: number, otp: string) {
    return handleResponse(await fetch(`${API_BASE}/service-requests/${id}/verify_otp/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp }),
    }))
  },

  async updateServiceStatus(id: number, status: string) {
    return handleResponse(await fetch(`${API_BASE}/service-requests/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    }))
  },

  // Experiences
  async getExperiences(): Promise<Experience[]> {
    return handleResponse(await fetch(`${API_BASE}/experiences/`))
  },
}
