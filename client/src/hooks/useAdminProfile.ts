"use client";

import { useEffect, useState } from "react";

export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
  signature: string;
  bio: string;
  avatar: string;
};

export const profileEvent = "fluentlearner:profile-updated";

const storageKey = (email: string) => `fluentlearner:admin-profile:${email.toLowerCase()}`;

export function loadAdminProfile(email: string, name = "Administrator"): AdminProfile {
  const fallback = { name, email, phone: "", signature: name, bio: "", avatar: "" };
  if (typeof window === "undefined") return fallback;
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey(email)) || "{}") };
  } catch {
    return fallback;
  }
}

export function saveAdminProfile(profile: AdminProfile, originalEmail: string) {
  localStorage.setItem(storageKey(originalEmail), JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(profileEvent, { detail: profile }));
}

export function useAdminProfile(email = "", name = "Administrator") {
  const [profile, setProfile] = useState<AdminProfile>(() => ({
    name, email, phone: "", signature: name, bio: "", avatar: "",
  }));

  useEffect(() => {
    if (!email) return;
    setProfile(loadAdminProfile(email, name));
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<AdminProfile>).detail;
      setProfile(detail || loadAdminProfile(email, name));
    };
    window.addEventListener(profileEvent, sync);
    return () => window.removeEventListener(profileEvent, sync);
  }, [email, name]);

  return profile;
}
