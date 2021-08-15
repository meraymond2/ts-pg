import { Md5 } from "ts-md5"
import * as Backend from "./backend-messages"
import { Channel } from "./channel"
import * as States from "./conn-state"
import { parseVal, TSType } from "./pg-types"

type Config = {
  host: string
  port: number
  database: string | undefined
  user: string
  password: string | undefined
}

type Row = Record<string, TSType>

export class Connection {
  private channel: Channel
  private state: States.State

  constructor(user: string, database: string | undefined) {
    this.channel = new Channel()
    this.state = { _tag: "Uninitialised", user, database }
  }

  // TODO: don't write query if there are other queries already in flight
  // TODO: error if trying to query when channel is closed
  simpleQuery = async (sql: string): Promise<Row[]> => {
    this.channel.write({
      _tag: "Query",
      query: sql,
    })
    const msgs = await this.readUntil(["ReadyForQuery"])
    let rows: Row[] = []
    let idx = 0
    // Simple queries can contain multiple SQL statments, so we need to handle
    // multiple unrelated results.
    while (idx < msgs.length) {
      const msg = msgs[idx]
      switch (msg._tag) {
        case "ErrorResponse":
          throw Error(msg.fields.message)
        case "Close":
          rows.push({ completed: msg.name })
          break
        case "EmptyQueryResponse":
          break
        case "RowDescription": {
          const { fields } = msg
          idx = idx + 1
          while (msgs[idx]._tag === "DataRow") {
            const msg = msgs[idx] as Backend.DataRow // sigh, TypeScript
            rows.push(
              msg.values.reduce(
                (fieldAcc, value, idx) => ({
                  ...fieldAcc,
                  [fields[idx].fieldName]: parseVal(value, fields[idx].dataTypeOid, "text"),
                }),
                {}
              )
            )
            idx = idx + 1
          }
        }
      }
      idx = idx + 1
    }
    return rows
  }

  extendedQuery = async (sql: string, params: TSType[]): Promise<Row[]> => {
    this.channel.write({
      _tag: "Parse",
      query: sql,
      name: "", // only using the statement once, so no need to name
      types: [], // let Postgres infer the types
    })
    this.channel.write({
      _tag: "Describe",
      describe: "statement",
      name: "", // describe the above statement, to get the row descriptions
    })
    this.channel.write({
      _tag: "Bind",
      params,
      portal: "", // only using the portal once, so no need to name
      stmt: "",
      paramFormats: ["text"], // just one, to specify all params are text
      resultFormats: ["binary"], // just one, to specify all results are binary
    })
    this.channel.write({
      _tag: "Execute",
      portal: "",
      maxRows: 0, // 0 means no limit on rows
    })
    this.channel.write({
      _tag: "Sync",
    })

    const msgs = await this.readUntil(["ReadyForQuery"])
    let fields: Backend.FieldDescription[] = []
    let rows: Row[] = []
    msgs.forEach((msg) => {
      switch (msg._tag) {
        case "ErrorResponse":
          throw Error(msg.fields.message)
        case "RowDescription": {
          fields = msg.fields
          break
        }
        case "DataRow":
          rows.push(
            msg.values.reduce(
              (fieldAcc, value, idx) => ({
                ...fieldAcc,
                [fields[idx].fieldName]: parseVal(value, fields[idx].dataTypeOid, "binary"),
              }),
              {}
            )
          )
        default:
          break
      }
    })

    return rows
  }

  describe = async (tableName: string): Promise<Row[]> =>
    this.simpleQuery(`
    SELECT column_name AS field, data_type AS type, column_default AS default, is_nullable AS nullable
    FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '${tableName}';
    `)

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
    return States.fromUnitialised(this.state, msgs)
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
    return States.fromPasswordRequested(this.state, msgs)
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

export const hashMd5 = (user: string, password: string, salt: Uint8Array): string => {
  let hash = new Md5()
  hash.appendAsciiStr(password)
  hash.appendAsciiStr(user)
  let hashed: string = hash.end() as string
  hash = new Md5()
  hash.appendStr(hashed)
  hash.appendByteArray(salt)
  hashed = hash.end() as string
  return "md5" + hashed
}
