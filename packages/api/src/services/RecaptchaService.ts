interface RecaptchaResponse {
  success: boolean;
  "error-codes"?: string[];
}

export class RecaptchaService {
  private secret: string | undefined;

  constructor() {
    this.secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!this.secret && process.env.NODE_ENV === "production") {
      console.error(
        "RECAPTCHA_SECRET_KEY is not configured in production; reCAPTCHA verification will always fail",
      );
    }
  }

  async verify(token: string): Promise<boolean> {
    if (!this.secret) {
      if (process.env.NODE_ENV === "production") {
        return false;
      }
      return true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: this.secret,
          response: token,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as RecaptchaResponse;
      return data.success;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
