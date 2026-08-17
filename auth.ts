import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // 1. Provider Google
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    // 2. Provider Email & Password (Credentials)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // DI SINI: Tambahkan logika verifikasi email & password ke database Anda
        // Contoh sederhana (dummy):
        if (
          credentials?.email === "mirsal.kilu@gmail.com" &&
          credentials?.password === "][p}{P][p03"
        ) {
          return { id: "1", name: "User Demo", email: "user@example.com" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Mengarahkan ke halaman login buatan kita
  },
});