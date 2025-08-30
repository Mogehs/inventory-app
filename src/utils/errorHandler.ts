/**
 * Utility functions for handling and formatting errors
 */

export const getAuthErrorMessage = (error: any): string => {
  if (!error?.code) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    // Login errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';

    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again in a few minutes.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    // Registration errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';

    case 'auth/weak-password':
      return 'Please choose a stronger password with at least 6 characters.';

    case 'auth/operation-not-allowed':
      return 'Account creation is currently disabled. Please contact support.';

    // Network errors
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';

    case 'auth/timeout':
      return 'Request timed out. Please try again.';

    // General errors
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again later.';

    default:
      return 'Something went wrong. Please try again.';
  }
};

export const getGeneralErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Don't show technical error messages to users
    return 'Something went wrong. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
};
