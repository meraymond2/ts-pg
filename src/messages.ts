/* Front End */
export type FMessage = StartupMessage | PasswordMessage

export type StartupMessage = {
  _tag: "StartupMessage"
  majorVersion: 3
  minorVersion: 0
  user: string
  database: string
}

export const StartupMessage = (user: string, database: string): StartupMessage => ({
  _tag: "StartupMessage",
  majorVersion: 3,
  minorVersion: 0,
  user,
  database,
})

export type PasswordMessage = {
  _tag: "PasswordMessage"
  password: string
}

export const PasswordMessage = (hashed: string): PasswordMessage => ({
  _tag: "PasswordMessage",
  password: hashed,
})

/* Back End */
export type BMessage = AuthenticationMD5Password | AuthenticationOk

export type AuthenticationMD5Password = {
  _tag: "AuthenticationMD5Password"
  salt: Uint8Array
}

export const AuthenticationMD5Password = (salt: Uint8Array): AuthenticationMD5Password => ({
  _tag: "AuthenticationMD5Password",
  salt,
})

export type AuthenticationOk = {
  _tag: "AuthenticationOk"
}

export const AuthenticationOk = (): AuthenticationOk => ({ _tag: "AuthenticationOk" })
