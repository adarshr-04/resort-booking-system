# Coorg Pristine Woods - Resort Management System User Manual

## 📑 Table of Contents
1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [User Roles](#3-user-roles)
4. [Getting Started](#4-getting-started)
5. [Customer Guide](#5-customer-guide)
6. [Admin Guide](#6-admin-guide)
7. [Troubleshooting](#7-troubleshooting)
8. [FAQs](#8-faqs)
9. [Contact & Support](#9-contact--support)
10. [🚧 Pending Implementations (Coming Soon)](#10-pending-implementations-coming-soon)

---

## 1️⃣ Introduction
This document provides a complete guide for using the **Coorg Pristine Woods Resort Booking System**.  
It is designed for both valued guests (customers) and resort staff (administrators) to understand how to use the web platform effectively to arrange stays and manage resort operations.

## 2️⃣ System Overview
The Resort Booking System allows **users** to:
- Browse our luxury room and suite collections
- Create an account and log in securely
- Submit booking/reservation requests online for specific dates
- View resort amenities, dining, and experiences

**Administrators** can:
- Access a secure, centralized Admin Dashboard
- Manage the Resort Inventory (Add new rooms)
- View detailed Guest Profiles and Dossiers
- Review and track the status of Booking Requests
- Update Global Resort Settings

## 3️⃣ User Roles
### 1. Customer (Guest)
- Can browse the public website and view all accommodation types.
- Can create an account to submit secure booking requests.
- *Note: Guests must be logged in to access the booking request forms.*

### 2. Admin (Staff)
- Manages room inventory and views bookings.
- Accesses the secure `/admin/dashboard` environment.
- Has highest-level access to guest data and resort revenue metrics.

## 4️⃣ Getting Started
**Step 1:** Open the Coorg Pristine Woods website link.  
**Step 2:** Explore the Home, About, and Accommodations pages without an account.  
**Step 3:** To make a booking, click **Sign In** (or Register/Sign Up if you are a new guest).  
**Step 4:** Once logged in as a guest, you can begin the booking process. If you are an Admin, click **Dashboard** in the top navigation to access staff tools.

## 5️⃣ Customer Guide
### 🔹 5.1 Browsing Accommodations
- Navigate to the **Accommodations** page from the top menu.
- Browse the available Room Categories (e.g., Palace Suite, Deluxe Room).
- View room details, guest capacity, and the per-night rate.

### 🔹 5.2 Requesting a Room
- **Step 1:** Select a room on the Accommodations page.  
- **Step 2:** Click **"Enquire"** or **"Book Now"**. *(You will be asked to log in if you haven't already).*  
- **Step 3:** On the Bookings form, enter your required check-in and check-out dates.  
- **Step 4:** Submit your request. A notification will be sent to the administration team for review.

## 6️⃣ Admin Guide
### 🔹 6.1 Admin Login
- Go to the standard **Sign In** page.
- Enter your Admin email and password.
- Once authenticated, click the **Dashboard** link in the navigation bar to enter the backend.

### 🔹 6.2 Managing Rooms (Inventory)
- Navigate to **Accommodations** within the Admin Dashboard.
- **To Add:** Click the "+ Add New Room" button in the top right. Fill out the room name, description, capacity, and the Day/Night pricing details in the modal, then save.
- *Note: The Dashboard correctly tracks total active inventory (e.g., 25 Rooms).*

### 🔹 6.3 Managing Guests
- Navigate to **Guest Relations** within the Admin Dashboard.
- View a list of all registered users on the platform.
- Click **"View Full Profile"** to open a detailed Guest Dossier modal containing their contact information and verification status (Aadhaar).

### 🔹 6.4 General Overview & Settings
- Admins can view top-level metrics on the main Dashboard (Total Revenue, Active Bookings, Occupancy).
- Navigate to **Settings** to modify core resort identity parameters (Resort Name, Base Currency).

## 7️⃣ Troubleshooting
**Issue:** Unable to login or register.  
**Solution:** Ensure you are using the correct email format. If the database was recently reset, you may need to register your account again. 

**Issue:** "Book Now" buttons redirect to the Login page.  
**Solution:** This is an intentional security feature. You must create an account and log in before placing a reservation request.

## 8️⃣ FAQs
**Q: How do guests know if a room is available?**  
A: The Accommodations page prevents submitting a booking if the dates strictly overlap with an existing reservation for that specific room.

**Q: Are room prices calculated correctly?**  
A: Yes, multi-day total prices are accurately calculated by the server using the designated "Per Night" rate.

## 9️⃣ Contact & Support
**Email:** reservations@coorgpristinewoods.com  
**Property Address:** Western Ghats Estate, Coorg, India  

---

## 🔟 🚧 Pending Implementations (Coming Soon)

*The following features are standard in resort booking systems but have **not yet been implemented** in the current version of the website. These module placeholders exist but require future backend development:*

1. **Payment Process (Payment Gateway):**
   - The platform currently captures *Booking Requests*, but does not yet process live credit card transactions (e.g., Stripe, PayPal). Payment processing must be implemented.
2. **Customer "My Bookings" Portal:**
   - While guests can request rooms, there is currently no dedicated frontend dashboard for guests to view their past bookings or cancel them without contacting support.
3. **Automated Search by Date:**
   - The homepage currently lacks a feature to input "Check-In/Check-Out" dates and return specifically available rooms globally.
4. **Automated Email Notifications:**
   - The system does not currently send automated confirmation or cancellation emails to the guest's inbox.
5. **Dashboard Notification Bell:**
   - The Admin notification bell icon is hidden while the real-time alert engine is finalized.
6. **Room Image Uploads:**
   - Currently, adding a room in the Admin Dashboard stores text details, but the image upload module needs to be connected to cloud storage to dynamically display uploaded photos.
