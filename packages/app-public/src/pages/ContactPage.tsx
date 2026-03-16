import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";
import { SubmitContactInputSchema } from "@satyrsmc/shared/dto/website";
import type { z } from "zod";
import { Hero } from "../components/Hero";
import { trpc } from "@satyrsmc/shared/client";

declare const __BUILD_RECAPTCHA_SITE_KEY__: string;
const RECAPTCHA_SITE_KEY = __BUILD_RECAPTCHA_SITE_KEY__ || "";

type ContactFormValues = z.infer<typeof SubmitContactInputSchema>;

const ContactPage: React.FC = () => {
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(SubmitContactInputSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      recaptcha_token: RECAPTCHA_SITE_KEY ? "" : "disabled",
    },
  });

  const mutation = trpc.website.submitContact.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => {
      if (RECAPTCHA_SITE_KEY) {
        recaptchaRef.current?.reset();
        setValue("recaptcha_token", "");
      }
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    mutation.mutate(data);
  };

  const handleRecaptchaChange = (token: string | null) => {
    setValue("recaptcha_token", token ?? "", { shouldValidate: true });
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
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                  <div>
                    <label htmlFor="contact-name" className="label">
                      Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="input w-full"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="label">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="input w-full"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="label">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="input w-full"
                      {...register("subject", {
                        setValueAs: (value: string) => (value === "" ? null : value),
                      })}
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
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {RECAPTCHA_SITE_KEY && (
                    <div>
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        theme="dark"
                        onChange={handleRecaptchaChange}
                        onExpired={() => setValue("recaptcha_token", "")}
                      />
                      {errors.recaptcha_token && (
                        <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                          {errors.recaptcha_token.message}
                        </p>
                      )}
                    </div>
                  )}

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
