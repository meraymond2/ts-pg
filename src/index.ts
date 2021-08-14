import { Connection as Conn } from "./connection"

const createDb = async (conn: Conn) => {
  const createRes = await conn.query("CREATE TABLE cats ( name text, age int, fluffy boolean );")
  console.log(createRes)

  const insertsRes = await conn.query(`
    INSERT INTO cats (name, age, fluffy) values ('Cascat', 8, true);
    INSERT INTO cats (name, age, fluffy) values ('Luna', 7, true);
  `)
  console.log(insertsRes)
}

const simplyQuery = async (conn: Conn) => {
  const res = await conn.query("SELECT * FROM cats")
  console.log(res)
}

const extendedQuery = async (conn: Conn) => {
  const res = await conn.extendedQuery("SELECT * FROM cats WHERE name = $1", ["Cascat"])
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

  // await createDb(conn)
  await simplyQuery(conn)
  // await extendedQuery(conn)
}

main()
