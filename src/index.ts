import { Connection as Conn } from "./connection"

const conn = Conn.init({
  host: "localhost",
  port: 5432,
  database: "dbname",
  user: "michael",
  password: "cascat",
})

const createDb = async (conn: Conn) => {
  const createRes = await conn.query("CREATE TABLE cats ( name text, age int );")
  console.log(createRes)

  const insertsRes = await conn.query(`
    INSERT INTO cats (name, age) values ('Cascat', 8);
    INSERT INTO cats (name, age) values ('Luna', 7);
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

// conn.then(createDb).catch(console.error)
// conn.then(simplyQuery).catch(console.error)
conn.then(extendedQuery).catch(console.error)

// conn.then((conn) => {
//   conn
//     .describe("cats")
//     .then(console.log)
//     .then(() => {
//       conn.close()
//     })
//     .catch((err) => {
//       console.error(err)
//       conn.close()
//     })
// })
