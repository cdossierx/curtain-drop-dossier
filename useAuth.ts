// Single-user private mode: no login required, one fixed owner
const SINGLE_USER = {
  id: 1,
  unionId: "single-user",
  name: "Owner",
  email: null,
  avatar: null,
  role: "admin" as const,
};

export function useAuth() {
  return {
    user: SINGLE_USER,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    logout: () => {}, // no-op in single-user mode
    refresh: () => {}, // no-op
  };
}
