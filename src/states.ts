/* States */
export type State = Uninitialised | PasswordRequested

export type Uninitialised = {
  _tag: "Uninitialised"
}

export type PasswordRequested = {
  _tag: "PasswordRequested"
  authType: "md5"
  salt: Uint8Array
}

export type Authorised = {
  _tag: "Authorised"
}
