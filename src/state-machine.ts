import { BMessage } from "./messages"

export type State = Unconnected | AskedForMD5Password

export type Unconnected = {
  _tag: "Unconnected"
  user: string
  password: string
  database: string
}

export const Unconnected = (user: string, password: string, database: string): Unconnected => ({
  _tag: "Unconnected",
  user,
  password,
  database,
})

export type AskedForMD5Password = {
  _tag: "AskedForMD5Password"
  salt: Uint8Array
}

export const AskedForMD5Password = (salt: Uint8Array): AskedForMD5Password => ({
  _tag: "AskedForMD5Password",
  salt,
})

export const dispatch = (state: State, msg: BMessage): State => {
  switch (state._tag) {
    case "Unconnected":
      switch (msg._tag) {
        case "AuthenticationMD5Password":
          return AskedForMD5Password(msg.salt)
      }
  }
  console.log(JSON.stringify(msg))
}
