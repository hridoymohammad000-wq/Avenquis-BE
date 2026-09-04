import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const state = vi.hoisted(() => ({
  current: undefined as { id: string; userId: string } | undefined,
  rotated: false,
  inserted: [] as string[],
  logoutRevoked: false,
}));

const fakeDb = vi.hoisted(() => ({
  transaction: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@avenquis/database", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  gt: vi.fn(),
  isNull: vi.fn(),
  refreshSessions: { tokenHash: {}, expiresAt: {}, revokedAt: {}, id: {} },
  revokedAuthTokens: { tokenHash: {}, expiresAt: {} },
  db: fakeDb,
}));

import { AuthService } from "../services/auth.service.js";

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

function createTransaction() {
  return {
    query: {
      refreshSessions: {
        findFirst: vi.fn(async () => (state.rotated ? undefined : state.current)),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            if (state.rotated) return [];
            state.rotated = true;
            return [{ id: state.current?.id }];
          }),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (value: { tokenHash: string }) => {
        state.inserted.push(value.tokenHash);
      }),
    })),
  };
}

describe("refresh-token rotation", () => {
  beforeEach(() => {
    state.current = { id: "session-1", userId: "user-1" };
    state.rotated = false;
    state.inserted = [];
    state.logoutRevoked = false;
    fakeDb.transaction.mockImplementation(async (callback: (tx: ReturnType<typeof createTransaction>) => unknown) => callback(createTransaction()));
    fakeDb.update.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => {
          state.logoutRevoked = true;
        }),
      })),
    }));
  });

  it("gives every refresh token a unique cryptographic jti", () => {
    const first = AuthService.generateTokens({ userId: "user-1", email: "user@example.com", aal: "aal1" });
    const second = AuthService.generateTokens({ userId: "user-1", email: "user@example.com", aal: "aal1" });
    expect(jwt.decode(first.refreshToken)).toMatchObject({ jti: expect.any(String) });
    expect(jwt.decode(second.refreshToken)).toMatchObject({ jti: expect.any(String) });
    expect((jwt.decode(first.refreshToken) as jwt.JwtPayload).jti).not.toBe((jwt.decode(second.refreshToken) as jwt.JwtPayload).jti);
  });

  it("rotates immediately and rejects replay of the old token", async () => {
    const original = AuthService.generateTokens({ userId: "user-1", email: "user@example.com", aal: "aal1" });
    state.current = { id: "session-1", userId: "user-1" };
    const result = await AuthService.rotateRefreshToken(original.refreshToken);
    expect(result.tokens.refreshToken).not.toBe(original.refreshToken);
    expect(state.inserted).toContain(hash(result.tokens.refreshToken));
    await expect(AuthService.rotateRefreshToken(original.refreshToken)).rejects.toThrow("revoked or not recognized");
  });

  it("rejects concurrent double refresh so only one request wins", async () => {
    const original = AuthService.generateTokens({ userId: "user-1", email: "user@example.com", aal: "aal1" });
    const results = await Promise.allSettled([
      AuthService.rotateRefreshToken(original.refreshToken),
      AuthService.rotateRefreshToken(original.refreshToken),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("revokes the durable refresh session on logout", async () => {
    await AuthService.revokeRefreshToken("refresh-token");
    expect(state.logoutRevoked).toBe(true);
  });
});
