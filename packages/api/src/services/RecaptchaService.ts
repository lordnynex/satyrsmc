interface RecaptchaResponse {
  success: boolean;
  "error-codes"?: string[];
}

export class RecaptchaService {
  private secret: string | undefined;

  constructor() {
    this.secret = process.env.RECAPTCHA_SECRET_KEY;
  }

  async verify(token: string): Promise<boolean> {
    if (!this.secret) {
      if (process.env.NODE_ENV === "production") {
        console.error("RECAPTCHA_SECRET_KEY is not configured in production; failing verification");
        return false;
      }
      return true;
    }

    try {
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: this.secret,
          response: token,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as RecaptchaResponse;
      return data.success;
    } catch {
      return false;
    }
  }
}
