import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./auth.service";
import { supabaseClient } from "@/db/supabase.client";

// Mock supabase client
vi.mock("@/db/supabase.client", () => ({
  supabaseClient: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    describe("Successful registration", () => {
      it("should sign up user with normalized email", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: null,
        };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        const result = await authService.signUp({
          email: "Test@Example.com",
          password: "password123",
        });

        expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
        expect(result).toEqual(mockAuthData);
      });

      it("should trim whitespace from email", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: null,
        };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        await authService.signUp({
          email: "  test@example.com  ",
          password: "password123",
        });

        expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      it("should convert email to lowercase", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: null,
        };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        await authService.signUp({
          email: "TEST@EXAMPLE.COM",
          password: "password123",
        });

        expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      it("should handle Polish characters in email domain", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@łódź.pl" },
          session: null,
        };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        await authService.signUp({
          email: "test@łódź.pl",
          password: "password123",
        });

        expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: "test@łódź.pl",
          password: "password123",
        });
      });
    });

    describe("Error handling", () => {
      it("should throw error when signUp fails", async () => {
        const mockError = { message: "Email already registered", code: "user_already_exists" };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        } as any);

        await expect(
          authService.signUp({
            email: "test@example.com",
            password: "password123",
          })
        ).rejects.toEqual(mockError);
      });

      it("should throw error for invalid email format", async () => {
        const mockError = { message: "Invalid email", code: "invalid_email" };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        } as any);

        await expect(
          authService.signUp({
            email: "invalid-email",
            password: "password123",
          })
        ).rejects.toEqual(mockError);
      });

      it("should throw error for weak password", async () => {
        const mockError = { message: "Password too weak", code: "weak_password" };

        vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        } as any);

        await expect(
          authService.signUp({
            email: "test@example.com",
            password: "123",
          })
        ).rejects.toEqual(mockError);
      });
    });
  });

  describe("signIn", () => {
    describe("Successful sign in", () => {
      it("should sign in user with normalized email", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token123" },
        };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        const result = await authService.signIn({
          email: "Test@Example.com",
          password: "password123",
        });

        expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
        expect(result).toEqual(mockAuthData);
      });

      it("should trim whitespace from email", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token123" },
        };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        await authService.signIn({
          email: "  test@example.com  ",
          password: "password123",
        });

        expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      it("should convert email to lowercase", async () => {
        const mockAuthData = {
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token123" },
        };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
          data: mockAuthData,
          error: null,
        } as any);

        await authService.signIn({
          email: "TEST@EXAMPLE.COM",
          password: "password123",
        });

        expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    describe("Error handling", () => {
      it("should throw error for invalid credentials", async () => {
        const mockError = { message: "Invalid login credentials", code: "invalid_credentials" };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        } as any);

        await expect(
          authService.signIn({
            email: "test@example.com",
            password: "wrong-password",
          })
        ).rejects.toEqual(mockError);
      });

      it("should throw error for unverified email", async () => {
        const mockError = { message: "Email not confirmed", code: "email_not_confirmed" };

        vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        } as any);

        await expect(
          authService.signIn({
            email: "test@example.com",
            password: "password123",
          })
        ).rejects.toEqual(mockError);
      });
    });
  });

  describe("signOut", () => {
    it("should sign out user successfully", async () => {
      vi.mocked(supabaseClient.auth.signOut).mockResolvedValue({
        error: null,
      });

      await expect(authService.signOut()).resolves.toBeUndefined();
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it("should throw error when sign out fails", async () => {
      const mockError = { message: "Sign out failed", code: "signout_error" };

      vi.mocked(supabaseClient.auth.signOut).mockResolvedValue({
        error: mockError,
      });

      await expect(authService.signOut()).rejects.toEqual(mockError);
    });
  });

  describe("getSession", () => {
    it("should return current session", async () => {
      const mockSession = {
        access_token: "token123",
        refresh_token: "refresh123",
        user: { id: "123" },
      };

      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      const result = await authService.getSession();

      expect(result).toEqual(mockSession);
      expect(supabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it("should return null when no session exists", async () => {
      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const result = await authService.getSession();

      expect(result).toBeNull();
    });

    it("should throw error when getSession fails", async () => {
      const mockError = { message: "Session error", code: "session_error" };

      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: mockError,
      } as any);

      await expect(authService.getSession()).rejects.toEqual(mockError);
    });
  });

  describe("getUser", () => {
    it("should return current user", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await authService.getUser();

      expect(result).toEqual(mockUser);
      expect(supabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it("should return null when no user exists", async () => {
      vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await authService.getUser();

      expect(result).toBeNull();
    });

    it("should throw error when getUser fails", async () => {
      const mockError = { message: "User error", code: "user_error" };

      vi.mocked(supabaseClient.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as any);

      await expect(authService.getUser()).rejects.toEqual(mockError);
    });
  });

  describe("resendVerificationEmail", () => {
    it("should resend verification email with normalized email", async () => {
      vi.mocked(supabaseClient.auth.resend).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.resendVerificationEmail("Test@Example.com");

      expect(supabaseClient.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "test@example.com",
      });
    });

    it("should trim whitespace from email", async () => {
      vi.mocked(supabaseClient.auth.resend).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.resendVerificationEmail("  test@example.com  ");

      expect(supabaseClient.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "test@example.com",
      });
    });

    it("should convert email to lowercase", async () => {
      vi.mocked(supabaseClient.auth.resend).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.resendVerificationEmail("TEST@EXAMPLE.COM");

      expect(supabaseClient.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "test@example.com",
      });
    });

    it("should throw error when resend fails", async () => {
      const mockError = { message: "Resend failed", code: "resend_error" };

      vi.mocked(supabaseClient.auth.resend).mockResolvedValue({
        data: {},
        error: mockError,
      } as any);

      await expect(authService.resendVerificationEmail("test@example.com")).rejects.toEqual(mockError);
    });
  });

  describe("requestPasswordReset", () => {
    // Mock window.location.origin for browser environment
    beforeEach(() => {
      // Mock window.location if not available (node environment)
      if (typeof window === "undefined") {
        (global as any).window = {
          location: { origin: "http://localhost:3000" },
        };
      } else if (!window.location) {
        (window as any).location = { origin: "http://localhost:3000" };
      }
    });

    afterEach(() => {
      // Cleanup global window mock if we created it
      if (typeof (global as any).window !== "undefined" && (global as any).window.location) {
        delete (global as any).window;
      }
    });

    it("should request password reset with normalized email", async () => {
      vi.mocked(supabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.requestPasswordReset("Test@Example.com");

      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
      });
    });

    it("should trim whitespace from email", async () => {
      vi.mocked(supabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.requestPasswordReset("  test@example.com  ");

      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
      });
    });

    it("should convert email to lowercase", async () => {
      vi.mocked(supabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.requestPasswordReset("TEST@EXAMPLE.COM");

      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
      });
    });

    it("should use correct redirect URL", async () => {
      vi.mocked(supabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.requestPasswordReset("test@example.com");

      expect(supabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
      });
    });

    it("should throw error when reset request fails", async () => {
      const mockError = { message: "Reset failed", code: "reset_error" };

      vi.mocked(supabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: mockError,
      } as any);

      await expect(authService.requestPasswordReset("test@example.com")).rejects.toEqual(mockError);
    });
  });

  describe("updatePassword", () => {
    it("should update user password", async () => {
      vi.mocked(supabaseClient.auth.updateUser).mockResolvedValue({
        data: { user: { id: "123" } },
        error: null,
      } as any);

      await authService.updatePassword("newPassword123");

      expect(supabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
    });

    it("should handle password update with special characters", async () => {
      vi.mocked(supabaseClient.auth.updateUser).mockResolvedValue({
        data: { user: { id: "123" } },
        error: null,
      } as any);

      await authService.updatePassword("P@ssw0rd!#$%");

      expect(supabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: "P@ssw0rd!#$%",
      });
    });

    it("should throw error when password update fails", async () => {
      const mockError = { message: "Update failed", code: "update_error" };

      vi.mocked(supabaseClient.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as any);

      await expect(authService.updatePassword("newPassword123")).rejects.toEqual(mockError);
    });

    it("should throw error for weak password", async () => {
      const mockError = { message: "Password too weak", code: "weak_password" };

      vi.mocked(supabaseClient.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as any);

      await expect(authService.updatePassword("123")).rejects.toEqual(mockError);
    });
  });

  describe("Edge cases", () => {
    it("should handle email with leading/trailing tabs", async () => {
      const mockAuthData = {
        user: { id: "123", email: "test@example.com" },
        session: null,
      };

      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      await authService.signUp({
        email: "\t\ttest@example.com\t\t",
        password: "password123",
      });

      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle email with newlines", async () => {
      const mockAuthData = {
        user: { id: "123", email: "test@example.com" },
        session: null,
      };

      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      await authService.signUp({
        email: "\ntest@example.com\n",
        password: "password123",
      });

      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle mixed case email with spaces", async () => {
      const mockAuthData = {
        user: { id: "123", email: "test@example.com" },
        session: null,
      };

      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      await authService.signUp({
        email: "  TeSt@ExAmPlE.CoM  ",
        password: "password123",
      });

      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });
});
