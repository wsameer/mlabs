// Shared types for Zustand stores
export interface BaseState {
  isLoading?: boolean;
  error?: string | null;
}

export interface AsyncAction<T = void> {
  (): Promise<T>;
}

// Common action types
export type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;
export type GetState<T> = () => T;
