import { ConflictException, UnauthorizedException } from '@nestjs/common';

// @nestjs/jwt v12 ships ESM-only, which ts-jest (CommonJS) cannot load.
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    createUser: jest.fn(),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as any, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('hashes the password and never returns it', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.findByUsername.mockResolvedValue(null);
      users.createUser.mockImplementation(async (d) => ({ id: 1, ...d }));

      const result = await service.register({
        username: 'dave',
        email: 'Dave@Example.com',
        password: 'secret123',
      });

      const stored = users.createUser.mock.calls[0][0];
      expect(stored.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', stored.password)).toBe(true);
      expect(stored.email).toBe('dave@example.com');
      expect(result).toEqual({ id: 1, username: 'dave', email: 'dave@example.com' });
    });

    it('throws 409 when email exists', async () => {
      users.findByEmail.mockResolvedValue({ id: 1 });
      await expect(
        service.register({ username: 'x', email: 'a@b.c', password: 'secret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws 409 when username exists', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.findByUsername.mockResolvedValue({ id: 1 });
      await expect(
        service.register({ username: 'x', email: 'a@b.c', password: 'secret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token and public user for valid credentials', async () => {
      const password = await bcrypt.hash('secret123', 10);
      users.findByEmail.mockResolvedValue({
        id: 7,
        username: 'dave',
        email: 'dave@example.com',
        password,
      });

      const result = await service.login({ email: 'dave@example.com', password: 'secret123' });

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 7,
        username: 'dave',
        email: 'dave@example.com',
      });
      expect(result).toEqual({
        token: 'signed.jwt.token',
        user: { id: 7, username: 'dave', email: 'dave@example.com' },
      });
    });

    it('throws 401 for wrong password', async () => {
      const password = await bcrypt.hash('secret123', 10);
      users.findByEmail.mockResolvedValue({ id: 7, email: 'd@e.f', password });
      await expect(
        service.login({ email: 'd@e.f', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 401 for unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'no@e.f', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
