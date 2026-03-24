import { z } from "zod";
import {
  EventRsvpStatus,
  RegistrationMethod,
  PaymentMethod,
  PaymentStatus,
  TshirtSize,
  TravelMode,
  RsvpLogCode,
} from "../../lib/enums";

// --- Badger details ---

export const BadgerDetailsSchema = z.object({
  tshirtSize: z.nativeEnum(TshirtSize),
  travelingBy: z.nativeEnum(TravelMode),
  club: z.string().nullable().optional(),
});
export type BadgerDetails = z.infer<typeof BadgerDetailsSchema>;

// --- Input schemas ---

export const SubmitTokenBadgerRegistrationInputSchema = z.object({
  token: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().optional(),
  zip: z.string().optional(),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(10),
  paymentMethod: z.nativeEnum(PaymentMethod),
  badgerDetails: BadgerDetailsSchema,
  waiverAccepted: z.boolean().refine((val) => val === true, {
    message: "Waiver must be accepted",
  }),
});
export type SubmitTokenBadgerRegistrationInput = z.infer<
  typeof SubmitTokenBadgerRegistrationInputSchema
>;

export const SubmitAuthBadgerRegistrationInputSchema = z.object({
  eventId: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  badgerDetails: BadgerDetailsSchema,
  waiverAccepted: z.boolean().refine((val) => val === true, {
    message: "Waiver must be accepted",
  }),
});
export type SubmitAuthBadgerRegistrationInput = z.infer<
  typeof SubmitAuthBadgerRegistrationInputSchema
>;

export const CreateAuthRsvpInputSchema = z.object({
  eventId: z.string(),
  waiverAccepted: z.boolean().refine((val) => val === true, {
    message: "Waiver must be accepted",
  }),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});
export type CreateAuthRsvpInput = z.infer<typeof CreateAuthRsvpInputSchema>;

export const MatchRegistrationInputSchema = z.object({
  rsvpId: z.string(),
  contactId: z.string(),
});
export type MatchRegistrationInput = z.infer<typeof MatchRegistrationInputSchema>;

export const ConfirmNewContactInputSchema = z.object({
  rsvpId: z.string(),
});
export type ConfirmNewContactInput = z.infer<typeof ConfirmNewContactInputSchema>;

export const ConfirmPaymentInputSchema = z.object({
  rsvpId: z.string(),
  note: z.string().optional(),
});
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentInputSchema>;

export const ConfirmBulkPaymentInputSchema = z.object({
  rsvpIds: z.array(z.string()).min(1).max(20),
  note: z.string().optional(),
});
export type ConfirmBulkPaymentInput = z.infer<typeof ConfirmBulkPaymentInputSchema>;

export const AdminCancelRsvpInputSchema = z.object({
  rsvpId: z.string(),
});
export type AdminCancelRsvpInput = z.infer<typeof AdminCancelRsvpInputSchema>;

export const ProcessRefundInputSchema = z.object({
  rsvpId: z.string(),
  note: z.string().optional(),
});
export type ProcessRefundInput = z.infer<typeof ProcessRefundInputSchema>;

export const CancelRsvpInputSchema = z.object({
  rsvpId: z.string(),
});
export type CancelRsvpInput = z.infer<typeof CancelRsvpInputSchema>;

export const RequestAccountFromRegistrationInputSchema = z.object({
  rsvpId: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RequestAccountFromRegistrationInput = z.infer<
  typeof RequestAccountFromRegistrationInputSchema
>;

// --- Submission schema ---

export const RsvpSubmissionSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string().nullable(),
  zip: z.string().nullable(),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
});
export type RsvpSubmissionOutput = z.infer<typeof RsvpSubmissionSchema>;

// --- Output schemas ---

export const RsvpOutputSchema = z.object({
  id: z.string(),
  contactId: z.string().nullable(),
  userId: z.string().nullable(),
  eventId: z.string(),
  status: z.nativeEnum(EventRsvpStatus),
  registrationMethod: z.nativeEnum(RegistrationMethod),
  paymentMethod: z.nativeEnum(PaymentMethod).nullable(),
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentAmountCents: z.number().nullable(),
  waiverAcceptedAt: z.string(),
  createdAt: z.string().nullable(),
  displayName: z.string().nullable(),
});
export type RsvpOutput = z.infer<typeof RsvpOutputSchema>;

export const RsvpAdminOutputSchema = RsvpOutputSchema.extend({
  submission: RsvpSubmissionSchema.nullable(),
  paymentConfirmedAt: z.string().nullable(),
  reviewedByUserId: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  badgerDetails: BadgerDetailsSchema.nullable(),
  contactDisplayName: z.string().nullable(),
});
export type RsvpAdminOutput = z.infer<typeof RsvpAdminOutputSchema>;

// --- RSVP Log ---

export const RsvpLogOutputSchema = z.object({
  id: z.string(),
  rsvpId: z.string(),
  loggedBy: z.string().nullable(),
  messageCode: z.nativeEnum(RsvpLogCode),
  message: z.string().nullable(),
  createdAt: z.string(),
});
export type RsvpLogOutput = z.infer<typeof RsvpLogOutputSchema>;
