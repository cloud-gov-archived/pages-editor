import { beforeEach, afterEach } from 'vitest';
import type { LocalTestContext } from './context.types';
import { getPayload, buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres'
import { config } from '@payload-config'
import { v4 as uuid } from 'uuid';

const initOptions = {
    secret: uuid(),
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URI || 'http://localhost:5432/pages_editor_test',
        }
      }),
}

// TODO: this runs per import, it would be nice to bring it down to once per
// test suite someday
const builtConfig = await buildConfig({ ...config, ...initOptions })
global.payload = await getPayload({ config: builtConfig })

beforeEach<LocalTestContext>(async ({ transactions }) => {
    const id = await payload.db.beginTransaction()
    // if we truly don't get a transaction back, we've broken
    // the isolation model anyway, just use 1
    transactions.set('tid',  id ?? 1)
})

afterEach<LocalTestContext>(async ({ transactions }) => {
    const tid = transactions.get('tid')
    if (tid) {
        await payload.db.rollbackTransaction(tid)
    }
})
