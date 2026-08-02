const ACCESS_TOKEN_KEY = "ameya_access_token";
const REFRESH_TOKEN_KEY = "ameya_refresh_token";
const PERSIST_KEY = "ameya_auth_persist";

type TokenStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function readPersistFlag(): boolean {
  // Default to persistent login when flag is missing (legacy sessions).
  const flag = localStorage.getItem(PERSIST_KEY);
  if (flag === null) return true;
  return flag === "1";
}

function activeStore(): TokenStore {
  return readPersistFlag() ? localStorage : sessionStorage;
}

function readToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeToken(store: TokenStore, key: string, value: string): void {
  store.setItem(key, value);
  const other = store === localStorage ? sessionStorage : localStorage;
  other.removeItem(key);
}

export const tokenStorage = {
  getAccessToken: (): string | null => readToken(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => readToken(REFRESH_TOKEN_KEY),

  isPersistent: (): boolean => readPersistFlag(),

  setPersistMode: (rememberMe: boolean): void => {
    localStorage.setItem(PERSIST_KEY, rememberMe ? "1" : "0");
  },

  setTokens: (access: string, refresh: string, rememberMe?: boolean): void => {
    if (typeof rememberMe === "boolean") {
      tokenStorage.setPersistMode(rememberMe);
    }
    const store = activeStore();
    writeToken(store, ACCESS_TOKEN_KEY, access);
    writeToken(store, REFRESH_TOKEN_KEY, refresh);
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
