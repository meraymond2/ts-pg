import * as States from "./states"
import * as Backend from "./backend-messages"
import { fromPasswordRequested, fromUnitialised } from "./transitions"
import { hashMd5 } from "./utils"
import { Channel } from "./channel"
import { TSType, parseVal } from "./pg_types"

type Config = {
  host: string
  port: number
  database: string | undefined
  user: string
  password: string | undefined
}

export class Connection {
  private channel: Channel
  private state: States.State

  constructor(user: string, database: string | undefined) {
    this.channel = new Channel()
    this.state = { _tag: "Uninitialised", user, database }
  }

  // TODO: don't write query if there are other queries already in flight
  // TODO: error if trying to query when channel is closed
  query = async (sql: string): Promise<Array<Record<string, TSType>>> => {
    this.channel.write({
      _tag: "Query",
      query: sql,
    })
    const msgs = await this.readUntil(["ReadyForQuery"])
    const rowDesc = msgs[0]
    if (rowDesc._tag !== "RowDescription") throw Error("Unreachable")
    const { fields } = rowDesc

    const rows = msgs.filter(Backend.isDataRow)
    return rows.reduce((rowAcc, row) => rowAcc.concat(
      row.values.reduce((fieldAcc, value, idx) => ({
        ...fieldAcc,
        [fields[idx].fieldName]: parseVal(value, fields[idx].dataTypeOid)
      }), {})
    ), [])
  }

  close = (): void => {
    this.channel.close()
  }

  static async init(config: Config): Promise<Connection> {
    const conn = new Connection(config.user, config.database)
    await conn.channel.init(config.host, config.port)
    conn.state = await conn.sendStartup()
    if (conn.state._tag === "PasswordRequested") {
      conn.state = await conn.sendPassword(config.password || "")
    }
    return conn
  }

  private sendStartup = async (): Promise<States.PasswordRequested | States.ReadyForQuery> => {
    if (this.state._tag !== "Uninitialised") throw Error("Invalid starting state.")

    this.channel.write({
      _tag: "StartupMessage",
      database: this.state.database || this.state.user,
      majorVersion: 3,
      minorVersion: 0,
      user: this.state.user,
    })
    const msgs = await this.readUntil([
      "AuthenticationMD5Password",
      "AuthenticationCleartextPassword",
      "ReadyForQuery",
    ])
    return fromUnitialised(this.state, msgs)
  }

  private sendPassword = async (
    password: string
  ): Promise<States.PasswordRequested | States.ReadyForQuery> => {
    if (this.state._tag !== "PasswordRequested") throw Error("Invalid starting state.")

    this.channel.write({
      _tag: "PasswordMessage",
      password:
        this.state.authType === "md5"
          ? hashMd5(this.state.user, password, this.state.salt)
          : password,
    })
    const msgs = await this.readUntil(["ReadyForQuery"])
    return fromPasswordRequested(this.state, msgs)
  }

  private readUntil = async (terminals: string[]): Promise<Backend.Msg[]> => {
    let msgs = []
    let atLastMessage = false
    while (!atLastMessage) {
      const msg = await this.channel.read()
      msgs.push(msg)
      atLastMessage = terminals.includes(msg._tag)
    }
    return msgs
  }
}
