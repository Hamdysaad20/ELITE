"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return {
          title: "Configuration Error",
          message: "There is a problem with the server configuration.",
          hint: "Please contact support if this continues.",
        };
      case "AccessDenied":
        return {
          title: "Access Denied",
          message: "You do not have permission to access this resource.",
          hint: "Please sign in with an authorized account.",
        };
      case "Verification":
        return {
          title: "Verification Failed",
          message: "The sign-in link is invalid or has expired.",
          hint: "Please request a new sign-in link.",
        };
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return {
          title: "Sign In Error",
          message: "There was a problem signing you in.",
          hint: "Please try again or contact support.",
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Account Linking Required",
          message: "This email is already associated with another account.",
          hint: "Please sign in using your original method.",
        };
      case "EmailSignin":
        return {
          title: "Email Error",
          message: "Unable to send sign-in email.",
          hint: "Please check your email address and try again.",
        };
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          message: "The credentials you provided are incorrect.",
          hint: "Please check your information and try again.",
        };
      case "SessionRequired":
        return {
          title: "Sign In Required",
          message: "You must be signed in to access this page.",
          hint: "Please sign in to continue.",
        };
      default:
        return {
          title: "Authentication Error",
          message: "An unexpected error occurred during authentication.",
          hint: "Please try again or contact support if the problem persists.",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Error Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl">
            ✕
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-base text-gray-600">
            {errorInfo.message}
          </p>
        </div>

        {/* Error Details */}
        <div className="mt-8 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  {errorInfo.hint}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-mono">
                Error code: {error}
              </p>
            </div>
          )}

          {/* What to do */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What can you do?
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Try signing in again</li>
              <li>Clear your browser cache and cookies</li>
              <li>Use a different browser or device</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full py-3 px-4 text-center text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-4 text-center text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}


