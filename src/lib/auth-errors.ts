/**
 * Maps Firebase Authentication error codes to user-friendly Persian messages.
 * @param errorCode The error code from a Firebase Auth exception.
 * @returns A user-friendly string in Persian.
 */
export function getFirebaseAuthErrorMessageFA(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'ایمیل یا رمز عبور نامعتبر است. لطفاً دوباره تلاش کنید.';
    
    case 'auth/email-already-in-use':
      return 'این ایمیل قبلاً توسط کاربر دیگری ثبت شده است.';
      
    case 'auth/weak-password':
      return 'رمز عبور ضعیف است. رمز عبور باید حداقل ۶ کاراکتر باشد.';
      
    case 'auth/too-many-requests':
      return 'تلاش‌های ناموفق بیش از حد بوده است. لطفاً چند لحظه بعد دوباره امتحان کنید.';
      
    case 'auth/network-request-failed':
      return 'خطا در اتصال به شبکه. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.';

    case 'auth/invalid-email':
      return 'فرمت ایمیل وارد شده نامعتبر است.';

    default:
      return 'یک خطای ناشناخته رخ داده است. لطفاً دوباره تلاش کنید.';
  }
}
