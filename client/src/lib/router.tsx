"use client";

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

export function useLocation(): [string, (to: string) => void] {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  return [pathname, to => router.push(to)];
}

export function useSearch() {
  const search = useSearchParams()?.toString() ?? "";
  return search ? `?${search}` : "";
}

export function useRoute<T extends Record<string, string> = Record<string, string>>(
  pattern: string,
): [boolean, T | null] {
  const pathname = usePathname() ?? "/";
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  const matches = patternParts.length === pathParts.length && patternParts.every((part, index) =>
    part.startsWith(":") || part === pathParts[index]
  );
  if (!matches) return [false, null];
  // The app is one catch-all page, so Next's params don't carry ":name" segments; read them from the path.
  const params: Record<string, string> = {};
  patternParts.forEach((part, index) => {
    if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(pathParts[index]);
  });
  return [true, params as T];
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: string;
  to?: string;
  children?: ReactNode;
};

export function Link({ href, to, onClick, ...props }: LinkProps) {
  const destination = href ?? to ?? "/";
  return <NextLink href={destination} onClick={onClick as ((event: MouseEvent<HTMLAnchorElement>) => void)} {...props} />;
}
