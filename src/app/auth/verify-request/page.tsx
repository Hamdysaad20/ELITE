"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl">
            ✓
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a magic link to
          </p>
          {email && (
            <p className="mt-1 text-base font-semibold text-amber-600">
              {email}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What's next?
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Open your email inbox</li>
              <li>Click the magic link we sent you</li>
              <li>You'll be signed in automatically</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Security tip:</strong> The link expires in 24 hours and can only be used once.
                </p>
              </div>
            </div>
          </div>

          {/* Didn't receive email? */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the email?
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                • Check your spam or junk folder
              </p>
              <p className="text-xs text-gray-500">
                • Make sure the email address is correct
              </p>
              <p className="text-xs text-gray-500">
                • Wait a few minutes and check again
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center border-t pt-6 space-y-2">
          <Link
            href="/auth/signin"
            className="block text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            Try a different email
          </Link>
          <Link
            href="/"
            className="block text-sm font-medium text-gray-600 hover:text-gray-500 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRequestContent />
    </Suspense>
  );
}


