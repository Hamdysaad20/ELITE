"use client";

import Link, { type LinkProps } from "next/link";
import { useLocale } from "next-intl";
import {
  addLocaleToPathname,
  isExternalHref,
  isHashHref,
} from "@/i18n/routing";

type LocalizedLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export default function LocalizedLink({
  href,
  children,
  ...rest
}: LocalizedLinkProps) {
  const locale = useLocale();

  if (isExternalHref(href) || isHashHref(href)) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const localizedHref = addLocaleToPathname(href, locale);

  return (
    <Link href={localizedHref} {...rest}>
      {children}
    </Link>
  );
}
