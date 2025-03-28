import 'dotenv/config'
import { Client } from 'pg'

// https://github.com/vitest-dev/vitest/blob/main/test/global-setup/globalSetup/default-export.js
let teardownHappened = false

console.log(process.env.TEST_DATABASE_URI)

const client = new Client({ connectionString: process.env.TEST_DATABASE_URI })

export default async function () {

    async function clearDatabase() {
        await client.connect()
        await client.query('DELETE * from users;')
        await client.query('DELETE * from sites;')
        await client.query('DELETE * from posts;')
        await client.query('DELETE * from pages;')
        return client.end()
    }

    // setup
    await clearDatabase()

    return async () => {
        if (teardownHappened) {
          throw new Error('teardown called twice')
        }
        // tear it down here
        teardownHappened = true
        return clearDatabase()
      }
}
