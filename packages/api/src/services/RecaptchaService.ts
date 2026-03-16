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
      return true;
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: this.secret,
        response: token,
      }),
    });

    const data = (await response.json()) as RecaptchaResponse;
    return data.success;
  }
}
