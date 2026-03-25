# Badger Flat Registration Guide

Badger Flat is the club's annual camping event. Registration is handled online through a form linked from a QR code on the printed mailer. This guide covers how to register as an attendee and how to manage registrations as an admin.

---

## For Attendees

### Registering via QR Code (No Account Required)

1. **Scan the QR code** on your Badger Flat mailer with your phone's camera.
2. The link opens the Badger Flat registration form at `satyrsmc.club/register/badger/...`.
3. If you already have a Satyrs MC account, tap **"Already have an account? Log in first"** at the top of the form. Logging in pre-fills your contact info and skips the admin review step. If you don't have an account, continue as a guest.
4. **Fill out the form:**
   - **Name** (first and last)
   - **Email**
   - **Phone**
   - **Address and ZIP** (optional)
   - **Emergency contact** (name and phone — required)
   - **T-shirt size** (S, M, L, XL, XXL, XXXL)
   - **How are you traveling?** (Motorcycle, Car/Truck, RV/Camper)
   - **Club affiliation** (optional)
   - **Payment method** (Check, Cash, Zelle, or Money Order)
5. **Read and accept the waiver.** Scroll through the full waiver text and check the "I accept" box.
6. **Submit the form.**
7. You'll see a confirmation page:
   > "You're registered for Badger Flat! An admin will review your registration. Your payment is pending until confirmed by the treasurer."
8. **Optional: Create an account.** After submitting, you can create a Satyrs MC account to view future events and manage your registration. Enter a password and verify your email. This is encouraged but not required.

### Registering as a Logged-In User

If you already have a Satyrs MC account:

1. **Log in** to the member portal.
2. Navigate to the **Badger Flat event**.
3. Click **"Register for Badger Flat."**
4. Your name, email, phone, and emergency contact are displayed (read-only, pulled from your profile). If anything is out of date, update your profile first.
5. Fill out the Badger-specific fields: t-shirt size, travel mode, club, and payment method.
6. Accept the waiver and submit.
7. Your registration is **automatically confirmed** — no admin review needed since your account is already linked to a contact record.

### Cancelling Your Registration

1. Log in and navigate to **My Registrations** (or the Badger Flat event page).
2. Click **"Cancel"** on your registration.
3. If your payment has already been confirmed by the treasurer, a refund request is automatically created. An officer will process your refund and reach out if needed.

### Payment

Payment is handled **outside the website**. When you register, you select how you plan to pay:

| Method          | How to Pay                                                        |
| --------------- | ----------------------------------------------------------------- |
| **Check**       | Mail a check to the club (address provided on the mailer)         |
| **Cash**        | Pay in person at a meeting or event                               |
| **Zelle**       | Send via Zelle to the club's Zelle contact (listed on the mailer) |
| **Money Order** | Mail to the club                                                  |

The treasurer will confirm your payment once it's received. Your payment status will update from "Pending" to "Confirmed."

---

## For Admins

### Setting Up a Badger Event for Registration

1. **Create the Badger event** in the admin panel (Events section) with `event_type: badger`. Set the `ga_ticket_cost` field to the ticket price (e.g., 200.00). This determines whether registrants are prompted for a payment method.
2. **Generate a registration token:** Create an invitation with:
   - Purpose: `event_open_registration`
   - Event: the Badger event
   - Contact: leave blank (this is an event-level token, not tied to a specific person)
   - Expiration: set to after the registration deadline (e.g., 60 days)
3. **Generate a QR code** pointing to `satyrsmc.club/register/badger/{token}`. Use the QR Codes tool in the admin panel.
4. **Print the QR code on the Badger mailer** and distribute.

The same token/URL is used by all recipients — it's reusable and not single-use.

### Reviewing Registrations

When someone registers via the QR code (without logging in), their registration is marked **"Pending."** An admin must match the submission to an existing contact or create a new one.

1. Navigate to the **Badger event** in the admin panel.
2. Open the **"Review Registrations"** tab.
3. You'll see a list of pending submissions:

   | Name (submitted) | Email             | Status  |
   | ---------------- | ----------------- | ------- |
   | Craig Thompson   | craig@example.com | Pending |
   | Joe Smith        | joe@email.com     | Pending |

4. **Click a row** to see the full submitted info: name, email, phone, address, emergency contact, t-shirt size, travel mode, club, and payment method.
5. **Search existing contacts** to see if this person is already in the system.
6. If a match is found, click **"Match to Contact"** and select the existing contact. The registration is linked and the temporary submission data is removed.
7. If no match is found, click **"Create New Contact."** The system creates a new contact record (with email, phone, and emergency contact) from the submitted info and links the registration.

Registrations from **logged-in users** skip this step entirely — they're automatically linked to the user's contact record.

### Payment Dashboard (Treasurer)

1. Navigate to the **Badger event** in the admin panel.
2. Open the **"Payments"** tab.
3. You'll see all registrations with their payment status:

   | Name           | Payment Method | Amount  | Status    |
   | -------------- | -------------- | ------- | --------- |
   | Craig Thompson | Zelle          | $200.00 | Pending   |
   | Joe Smith      | Check          | $200.00 | Pending   |
   | Maria Garcia   | Cash           | $200.00 | Confirmed |

4. **Confirm a payment:** Click the checkmark next to a registration, optionally add a note (e.g., "Zelle received 3/15 from @craig"). The payment status changes to "Confirmed."
5. **Bulk confirm:** Select multiple registrations and confirm them all at once. Useful when processing a batch of checks or Zelle payments.

### Handling Cancellations and Refunds

When a registrant (or admin) cancels a registration:

- The registration status changes to **"No."**
- If payment was already confirmed, the payment status changes to **"Refund Requested."**

To process a refund:

1. Open the **Payment Dashboard** and find entries with status "Refund Requested."
2. For **offline payments** (cash, check, Zelle, money order):
   - Process the refund outside the system (mail a check, send Zelle, return cash at a meeting, etc.).
   - Click **"Mark Refunded"** and enter a note describing how the refund was handled (e.g., "Check mailed 3/20", "Cash returned at March meeting").
3. For **online payments** (Stripe, when available):
   - Click **"Process Refund"** — the system handles the refund through the payment processor automatically.
4. The payment status updates to **"Refunded"** and a log entry records the details.

### Cancelling a Registration (Admin)

1. Navigate to the event registrations list.
2. Select a registration and click **"Cancel Registration."**
3. The same cancellation and refund flow applies as when a user cancels themselves.

### Registration Statuses

| Status          | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| **No Response** | Default — admin-added attendee who hasn't responded yet     |
| **Pending**     | Submitted via QR code, awaiting admin to match to a contact |
| **Yes**         | Contact matched (or logged-in user), confirmed attending    |
| **No**          | Registration cancelled by user or admin                     |

### Payment Statuses

| Status               | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| **Not Required**     | Free event, no payment needed                            |
| **Pending**          | Payment method selected, awaiting treasurer confirmation |
| **Confirmed**        | Treasurer verified payment received                      |
| **Refund Requested** | Registration cancelled after payment was confirmed       |
| **Refunded**         | Refund processed (online or offline)                     |

### Audit Trail

Every registration action is logged automatically:

- Registration created
- Contact matched / new contact created
- Payment confirmed
- Registration cancelled (by user or admin)
- Refund processed
- Account linked

Admins can view the full audit log for any registration from the registration detail view. Each log entry records who performed the action, when, and any notes.

---

## Regular Event RSVPs

The RSVP system also supports non-Badger events (day rides, turkey poker ride, etc.):

- **Free events:** Logged-in users click "RSVP," accept the waiver, and they're registered. No payment step.
- **Paid events:** Same flow, but users are prompted to select a payment method. The treasurer confirms payment through the same dashboard.
- **No Badger-specific fields** (t-shirt, travel, club) for regular events.

---

## Invitation System

Beyond Badger registration, the platform includes a general invitation system for other use cases:

| Purpose            | Description                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ride walk-up**   | A ride leader can generate an invitation for someone who shows up to a ride without an account. The person receives a link to create an account and RSVP.          |
| **Officer invite** | Officers can send personalized invitations to known contacts.                                                                                                      |
| **Account setup**  | Admins can bulk-generate account setup invitations for contacts who don't have platform accounts yet. Each contact receives a unique link to create their account. |

All invitations are single-use (except event registration tokens), time-limited, and tracked in the system.
