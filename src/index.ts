import { Connection as Conn } from "./connection"

const conn = Conn.init({
  host: "localhost",
  port: 5432,
  database: "dbname",
  user: "michael",
  password: "cascat",
})

// conn.then((conn) => {
//   conn
//     .query("CREATE TABLE cats ( name text, age int );")
//     // .query("DROP TABLE cats;")
//     .then(console.log)
//     .then(() => conn.query("INSERT INTO cats (name, age) values ('Cascat', 8);"))
//     .then(console.log)
//     .then(() => conn.query("INSERT INTO cats (name, age) values ('Luna', 7);"))
//     .then(console.log)
//     .then(() => conn.close())
//     .catch((err) => {
//       console.error(err)
//       conn.close()
//     })
// })

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

conn.then((conn) => {
  conn
    .query("SELECT * FROM cats;")
    .then(console.log)
    .then(() => {
      conn.close()
    })
    .catch((err) => {
      console.error(err)
      conn.close()
    })
})
