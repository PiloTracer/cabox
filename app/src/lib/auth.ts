import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Fallback to initial ENV admin if the standard DB query isn't set up yet
        if (email === process.env.ADMIN_EMAIL) {
          const hash = process.env.ADMIN_PASSWORD_HASH ?? '';
          const isValid = await bcrypt.compare(password, hash);
          if (isValid) {
            return {
              id: 'admin',
              email,
              name: 'Super Admin',
              role: 'ADMIN',
            };
          }
        }

        // Check against the database
        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || user.role !== 'ADMIN') {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || 'Admin',
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as typeof user & { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role?: string }).role =
          token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
