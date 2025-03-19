import { test as vitest } from 'vitest'
import type { LocalTestContext } from './context.types'
import { getPayload, buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres'
import { config } from '@payload-config'
import { v4 as uuid } from 'uuid';

// const initOptions = {
//     secret: uuid(),
//     db: postgresAdapter({
//         pool: {
//             connectionString: process.env.DATABASE_URI || 'http://localhost:5432/pages_editor_test',
//         }
//       }),
// }

// TODO: this runs per import, it would be nice to bring it down to once per
// test suite someday
// const builtConfig = await buildConfig({ ...config, ...initOptions })
// const payload = await getPayload({ config: builtConfig })

// const sites = (await payload.find({
//     collection: 'sites'
// })).docs

// const posts = (await payload.find({
//     collection: 'posts'
// })).docs
// we can't easily use transactionId as a primitive as part of the test context
// in conjunction with having fixtures.
// this is "intended" behavior but means we have to jump through some hoops
// https://github.com/vitest-dev/vitest/issues/7701
export const test = vitest.extend<LocalTestContext>({
    transactions: new Map(),
    // sites,
    // posts,
    // payload
})
