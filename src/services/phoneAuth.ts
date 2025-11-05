// PhoneAuthService removed — stub to avoid runtime errors if referenced.
export class PhoneAuthService {
  initializeRecaptcha(_: string) {
    // no-op
    return null as any;
  }
  async sendOTP(_: string, __: string): Promise<boolean> {
    // Not implemented in this build — OTP flow removed.
    return Promise.resolve(false);
  }
  async verifyOTP(_: string, __: string): Promise<boolean> {
    return Promise.resolve(false);
  }
  cleanup() {
    // no-op
  }
}