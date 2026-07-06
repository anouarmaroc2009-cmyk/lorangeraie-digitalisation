import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User extends DefaultUser {
    role: "DIRECTION" | "STAFF"
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      role: "DIRECTION" | "STAFF"
      email: string
      name: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "DIRECTION" | "STAFF"
    id: string
  }
}
