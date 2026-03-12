import React from "react";
import { Hero } from "../components/Hero";
import { trpc } from "@satyrsmc/shared/client";

const ContactPage: React.FC = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const mutation = trpc.website.submitContact.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      email,
      subject: subject || null,
      message,
    });
  };

  return (
    <div className="stack max-w-5xl mx-auto" style={{ gap: "var(--space-6)" }}>
      <Hero title="Contact Us" subtitle="We'd love to hear from you." />

      <div className="grid gap-8" style={{ gridTemplateColumns: "1fr" }}>
        <div className="max-w-2xl mx-auto w-full">
          <div className="card">
            <div className="card-body flex flex-col gap-4">
              <div className="mb-4" style={{ color: "var(--color-muted)" }}>
                <p className="m-0 mb-2">
                  <strong style={{ color: "var(--color-text)" }}>Mailing Address:</strong> P.O. Box
                  1137, Los Angeles, CA
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-8" style={{ color: "var(--color-accent)" }}>
                  <p className="text-lg font-semibold m-0 mb-2">Thank you for your message!</p>
                  <p className="m-0" style={{ color: "var(--color-muted)" }}>
                    We&rsquo;ll get back to you as soon as we can.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="contact-name" className="label">
                      Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="input w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="label">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="input w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="label">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="input w-full"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="label">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      className="textarea w-full"
                      rows={5}
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
                    className="btn btn-primary w-fit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
