# Badger Flat Registration Guide

Badger Flat is the club's annual camping event. Registration is handled online through a form linked from a QR code on the printed mailer. An account is required to register. This guide covers how to register as an attendee and how to manage registrations as an admin.

---

## For Attendees

### Registering via QR Code

1. **Scan the QR code** on your Badger Flat mailer with your phone's camera.
2. The link opens the Badger Flat registration form at `members.satyrsmc.club/events/{id}`.
3. **Log in** to your Satyrs MC account. If you don't have one yet, register for an account at `members.satyrsmc.club/register`
4. Your name, email, phone, and emergency contact are displayed (read-only, pulled from your profile). If anything is out of date, update your profile first.
5. **Fill out the Badger-specific fields:**
   - **T-shirt size** (S, M, L, XL, XXL, XXXL)
   - **How are you traveling?** (Motorcycle, Car/Truck, RV/Camper)
   - **Club affiliation** (optional)
   - **Payment method** (Check, Cash, Zelle, or Credit Card)
6. **Read and accept the waiver.** Scroll through the full waiver text and check the "I accept" box.
7. **Submit the form.**
8. Your registration is confirmed. You'll see a confirmation page with your registration details.

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
| **Credit Card** | Pay online via the member portal                                  |

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
3. **Generate a QR code** pointing to `members.satyrsmc.club/events/{id}`. Use the QR Codes tool in the admin panel.
4. **Print the QR code on the Badger mailer** and distribute.

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
2. For **offline payments** (cash, check, Zelle):
   - Process the refund outside the system (mail a check, send Zelle, return cash at a meeting, etc.).
   - Click **"Mark Refunded"** and enter a note describing how the refund was handled (e.g., "Check mailed 3/20", "Cash returned at March meeting").
3. For **online payments** (credit card):
   - Click **"Process Refund"** — the system handles the refund through the payment processor automatically.
4. The payment status updates to **"Refunded"** and a log entry records the details.

### Cancelling a Registration (Admin)

1. Navigate to the event attendees list.
2. Select a attendees and click **"Cancel Registration."**
3. The same cancellation and refund flow applies as when a user cancels themselves.

### Registration Statuses

| Status      | Meaning                                      |
| ----------- | -------------------------------------------- |
| **Pending** | Registered but **payment** not yet confirmed |
| **Yes**     | Confirmed attending                          |
| **No**      | Registration cancelled by user or admin      |

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
