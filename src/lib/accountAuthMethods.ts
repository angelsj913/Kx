type AccountProvider = {
  provider: string;
};

type AuthMethodsUser = {
  email: string | null;
  passwordHash: string | null;
  accounts: AccountProvider[];
};

type UnlinkPasswordState = {
  passwordHash: string | null;
};

export type AuthMethods = {
  hasPassword: boolean;
  google: {
    linked: boolean;
    email?: string;
  };
};

export type GoogleUnlinkPrecondition =
  | { ok: true }
  | { ok: false; status: 400; error: "password_required" };

export function buildAuthMethods(user: AuthMethodsUser): AuthMethods {
  const linked = user.accounts.some((account) => account.provider === "google");
  return {
    hasPassword: !!user.passwordHash,
    google: {
      linked,
      ...(linked && user.email ? { email: user.email } : {}),
    },
  };
}

export function googleUnlinkPrecondition(
  user: UnlinkPasswordState,
): GoogleUnlinkPrecondition {
  if (!user.passwordHash) {
    return { ok: false, status: 400, error: "password_required" };
  }
  return { ok: true };
}
