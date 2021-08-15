import { Connection as Conn } from "./connection"
import { log } from "./utils"

const createDb = async (conn: Conn) => {
  const createRes = await conn.simpleQuery(
    "CREATE TABLE cats ( name text, age int, cheeky boolean );"
  )
  console.log(createRes)

  const insertsRes = await conn.simpleQuery(`
    INSERT INTO cats (name, age, cheeky) values ('Cas', 8, true);
    INSERT INTO cats (name, age, cheeky) values ('Luna', 7, false);
  `)
  console.log(insertsRes)
}

const describe = async (conn: Conn) => {
  const descRes = await conn.describe("cats")
  console.log(descRes)
}

const simplyQuery = async (conn: Conn) => {
  const res = await conn.simpleQuery("SELECT * FROM cats")
  console.log(res)
}

const extendedQuery = async (conn: Conn) => {
  const res = await conn.extendedQuery("SELECT * FROM cats WHERE name = $1", ["Cas"])
  console.log(res)
}

const main = async () => {
  const conn = await Conn.init({
    host: "localhost",
    port: 5432,
    database: "dbname",
    user: "michael",
    password: "cascat",
  })

  await createDb(conn)
  await describe(conn)
  // await simplyQuery(conn)
  // await extendedQuery(conn)
}

main().catch(log.error)
