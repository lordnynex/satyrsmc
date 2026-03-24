import { Entity, PrimaryColumn, Column } from "typeorm";
import {
  EventRsvpStatus,
  RegistrationMethod,
  PaymentMethod,
  PaymentStatus,
} from "@satyrsmc/shared/lib/enums";
import type {
  EventRsvpStatus as EventRsvpStatusType,
  RegistrationMethod as RegistrationMethodType,
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
} from "@satyrsmc/shared/lib/enums";

@Entity("event_rsvps")
export class EventRsvp {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text", nullable: true })
  contactId!: string | null;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId!: string | null;

  @Column({ name: "event_id", type: "text" })
  eventId!: string;

  @Column({
    name: "registration_method",
    type: "enum",
    enum: RegistrationMethod,
    enumName: "registration_method_enum",
  })
  registrationMethod!: RegistrationMethodType;

  @Column({ name: "invitation_id", type: "text", nullable: true })
  invitationId!: string | null;

  @Column({
    type: "enum",
    enum: EventRsvpStatus,
    enumName: "event_rsvp_status_enum",
    default: EventRsvpStatus.PendingReview,
  })
  status!: EventRsvpStatusType;

  @Column({ name: "cancelled_at", type: "timestamptz", nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: "reviewed_by_user_id", type: "text", nullable: true })
  reviewedByUserId!: string | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: "waiver_content_hash", type: "text" })
  waiverContentHash!: string;

  @Column({ name: "waiver_accepted_at", type: "timestamptz" })
  waiverAcceptedAt!: Date;

  @Column({ name: "waiver_ip", type: "text" })
  waiverIp!: string;

  @Column({ name: "waiver_user_agent", type: "text", nullable: true })
  waiverUserAgent!: string | null;

  @Column({
    name: "payment_method",
    type: "enum",
    enum: PaymentMethod,
    enumName: "payment_method_enum",
    nullable: true,
  })
  paymentMethod!: PaymentMethodType | null;

  @Column({
    name: "payment_status",
    type: "enum",
    enum: PaymentStatus,
    enumName: "payment_status_enum",
    default: PaymentStatus.NotRequired,
  })
  paymentStatus!: PaymentStatusType;

  @Column({ name: "payment_amount_cents", type: "integer", nullable: true })
  paymentAmountCents!: number | null;

  @Column({ name: "payment_confirmed_by_user_id", type: "text", nullable: true })
  paymentConfirmedByUserId!: string | null;

  @Column({ name: "payment_confirmed_at", type: "timestamptz", nullable: true })
  paymentConfirmedAt!: Date | null;

  @Column({ name: "external_payment_id", type: "text", nullable: true })
  externalPaymentId!: string | null;

  @Column({ name: "external_refund_id", type: "text", nullable: true })
  externalRefundId!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
