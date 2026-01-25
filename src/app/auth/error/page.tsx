"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const t = useTranslations("authError");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return {
          title: t("errors.configuration.title"),
          message: t("errors.configuration.message"),
          hint: t("errors.configuration.hint"),
        };
      case "AccessDenied":
        return {
          title: t("errors.accessDenied.title"),
          message: t("errors.accessDenied.message"),
          hint: t("errors.accessDenied.hint"),
        };
      case "Verification":
        return {
          title: t("errors.verification.title"),
          message: t("errors.verification.message"),
          hint: t("errors.verification.hint"),
        };
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return {
          title: t("errors.signIn.title"),
          message: t("errors.signIn.message"),
          hint: t("errors.signIn.hint"),
        };
      case "OAuthAccountNotLinked":
        return {
          title: t("errors.accountNotLinked.title"),
          message: t("errors.accountNotLinked.message"),
          hint: t("errors.accountNotLinked.hint"),
        };
      case "EmailSignin":
        return {
          title: t("errors.emailSignin.title"),
          message: t("errors.emailSignin.message"),
          hint: t("errors.emailSignin.hint"),
        };
      case "CredentialsSignin":
        return {
          title: t("errors.credentials.title"),
          message: t("errors.credentials.message"),
          hint: t("errors.credentials.hint"),
        };
      case "SessionRequired":
        return {
          title: t("errors.sessionRequired.title"),
          message: t("errors.sessionRequired.message"),
          hint: t("errors.sessionRequired.hint"),
        };
      default:
        return {
          title: t("errors.default.title"),
          message: t("errors.default.message"),
          hint: t("errors.default.hint"),
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
          <p className="mt-2 text-base text-gray-600">{errorInfo.message}</p>
        </div>

        {/* Error Details */}
        <div className="mt-8 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">{errorInfo.hint}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-mono">
                {t("errorCode", { code: error })}
              </p>
            </div>
          )}

          {/* What to do */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t("nextSteps.title")}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>{t("nextSteps.items.retry")}</li>
              <li>{t("nextSteps.items.clearCache")}</li>
              <li>{t("nextSteps.items.useDifferentBrowser")}</li>
              <li>{t("nextSteps.items.contactSupport")}</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <LocalizedLink
            href="/auth/signin"
            className="block w-full py-3 px-4 text-center text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {t("actions.tryAgain")}
          </LocalizedLink>
          <LocalizedLink
            href="/"
            className="block w-full py-3 px-4 text-center text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            {t("actions.backToHome")}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  const t = useTranslations("authError");
  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <ErrorContent />
    </Suspense>
  );
}
