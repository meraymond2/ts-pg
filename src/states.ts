

/* States */
export type State = Uninitialised | PasswordRequested

export type Uninitialised = {
  _tag: "Uninitialised"
}

export type AuthenticationType = "md5"

export type PasswordRequested = {
  _tag: "PasswordRequested"
  authType: AuthenticationType
}

export type Authorised = {
  _tag: "Authorised"
}
