import { supabaseClient } from "../../db/supabase.client";

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData) {
    // Normalize email: trim whitespace and convert to lowercase
    const email = data.email.trim().toLowerCase();

    const { data: authData, error } = await supabaseClient.auth.signUp({
      email,
      password: data.password,
    });

    if (error) {
      throw error;
    }

    return authData;
  },

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData) {
    // Normalize email: trim whitespace and convert to lowercase
    const email = data.email.trim().toLowerCase();

    const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error) {
      throw error;
    }

    return authData;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  },

  /**
   * Get the current user
   */
  async getUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseClient.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string) {
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Update user password (after clicking reset link)
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  },
};
