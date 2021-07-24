export type ConnectCallback = () => Promise<void>

/* States */
export type State = Uninitialised | StartupSent | PasswordRequested | Authorised

export type Uninitialised = {
  _tag: "Uninitialised"
  user: string
  password: string
  database: string
}

export type StartupSent = {
  _tag: "StartupSent"
  user: string
  password: string
  onConnect: ConnectCallback
}

export type PasswordRequested = {
  _tag: "PasswordRequested"
  authType: "md5"
  onConnect: ConnectCallback
}

export type Authorised = {
  _tag: "Authorised"
}

/* Transitions */
export const sendStartup = (state: Uninitialised, onConnect: ConnectCallback): StartupSent => ({
  _tag: "StartupSent",
  user: state.user,
  password: state.password,
  onConnect: onConnect,
})

export const receivePasswordReq = (state: StartupSent, authType: "md5"): PasswordRequested => ({
  _tag: "PasswordRequested",
  authType,
  onConnect: state.onConnect,
})

export const passwordAuthorised = (_state: PasswordRequested): Authorised => ({
  _tag: "Authorised",
})
