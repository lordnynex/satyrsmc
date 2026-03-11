import React from "react";
import { trpc } from "@satyrsmc/shared/client";

interface ContactMemberModalProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

export const ContactMemberModal: React.FC<ContactMemberModalProps> = ({
  memberId,
  memberName,
  onClose,
}) => {
  const [senderName, setSenderName] = React.useState("");
  const [senderEmail, setSenderEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const mutation = trpc.website.submitContactMember.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      member_id: memberId,
      sender_name: senderName,
      sender_email: senderEmail,
      message,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card w-full max-w-md"
        style={{ backgroundColor: "var(--color-surface)", opacity: 1 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Contact ${memberName}`}
      >
        <div className="card-body flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-semibold">Contact {memberName}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-6" style={{ color: "var(--color-accent)" }}>
              <p className="text-lg font-semibold m-0 mb-2">Message sent!</p>
              <p className="m-0" style={{ color: "var(--color-muted)" }}>
                Your message has been forwarded to {memberName}.
              </p>
              <button onClick={onClose} className="btn btn-primary mt-4">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="sender-name" className="label">
                  Your Name *
                </label>
                <input
                  id="sender-name"
                  type="text"
                  className="input w-full"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="sender-email" className="label">
                  Your Email *
                </label>
                <input
                  id="sender-email"
                  type="email"
                  className="input w-full"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="member-message" className="label">
                  Message *
                </label>
                <textarea
                  id="member-message"
                  className="textarea w-full"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {mutation.error && (
                <p className="text-sm" style={{ color: "#ef4444" }}>
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full text-center"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
