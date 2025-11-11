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
  async signUp(data: SignUpData) {
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

  async signIn(data: SignInData) {
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

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }
  },

  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  },

  async getUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  },

  async resendVerificationEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseClient.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (error) {
      throw error;
    }
  },

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  },
};
