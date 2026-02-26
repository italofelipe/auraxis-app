import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "auraxis.access-token";
const USER_EMAIL_KEY = "auraxis.user-email";

export interface StoredSession {
  readonly accessToken: string;
  readonly userEmail: string;
}

export const loadStoredSession = async (): Promise<StoredSession | null> => {
  const [accessToken, userEmail] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(USER_EMAIL_KEY),
  ]);

  if (!accessToken || !userEmail) {
    return null;
  }

  return {
    accessToken,
    userEmail,
  };
};

export const persistStoredSession = async (session: StoredSession): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(USER_EMAIL_KEY, session.userEmail),
  ]);
};

export const clearStoredSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_EMAIL_KEY),
  ]);
};
