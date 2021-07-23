import { Conn } from "./conn"
import { StartupMessage } from "./messages"

/* States */
export type State = Uninitialised | StartupSent | PasswordRequested | Authorised

export type Uninitialised = {
  _tag: "Uninitialised"
  user: string
  password: string
  database: string
}

export const Uninitialised = (user: string, password: string, database: string): Uninitialised => ({
  _tag: "Uninitialised",
  user,
  password,
  database,
})

export type StartupSent = {
  _tag: "StartupSent"
  user: string
  password: string
  callback: () => Promise<void>
}

export type PasswordRequested = {
  _tag: "PasswordRequested"
  authType: "md5"
  callback: () => Promise<void>
}

export type Authorised = {
  _tag: "Authorised"
}

/* Transitions */
export const sendStartup = (user: string, password: string, callback: () => Promise<void>): StartupSent => ({
  _tag: "StartupSent",
  user,
  password,
  callback,
})

export const receivePasswordReq = (callback: () => Promise<void>): PasswordRequested => ({
  _tag: "PasswordRequested",
  authType: "md5",
  callback,
})
