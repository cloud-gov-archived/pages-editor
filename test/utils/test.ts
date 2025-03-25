import { test as vitest } from 'vitest'
import type { LocalTestContext } from './context.types'
import { getPayload, buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres'
import { config } from '@payload-config'
import { v4 as uuid } from 'uuid';
import { setUserSite } from './localHelpers';
import { use } from 'react';

const payload = global.payload

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

// we can't easily use transactionId as a primitive as part of the test context
// in conjunction with having fixtures.
// this is "intended" behavior but means we have to jump through some hoops
// https://github.com/vitest-dev/vitest/issues/7701
export const test = vitest.extend<LocalTestContext>({
    tid: async ({ payload }, use) => {
        const tid = await payload.db.beginTransaction()
        if (!tid) throw new Error('no transaction')
        await use(tid)
        await payload.db.rollbackTransaction(tid)

    },
    defaultUserRole: 'user',
    defaultUserAdmin: false,
    siteNames: ['site1', 'site2', 'site3'],
    sites: [async({ payload, tid, siteNames }, use) => {
            const sites = await Promise.all(siteNames.map(name => {
                return payload.create({
                    collection: 'sites',
                    data: {
                        name
                    },
                    req: {
                        transactionID: tid
                    }
                })
            }))
            await use(sites)
        },
        { auto: true }
    ],
    pages: async({ payload, tid, sites }, use) => {
        const pages = await Promise.all(sites.map(async site => {
            return payload.create({
                collection: 'pages',
                data: {
                    title: `${site.name} Title`,
                    site
                },
                req: {
                    transactionID: tid
                }
            })
        }))
        await use(pages)
    },
    posts: [],
    users: [],
    testUser: async({ payload, tid, sites, defaultUserRole, defaultUserAdmin }, use) => {
        // guarantee there is one base user in the test DB
        const email = 'test@agency.gov'

        const defaultUser = await payload.create({
            collection: 'users',
            data: {
                email,
                sites: [{
                    site: sites[0],
                    role: defaultUserRole
                }],
                isAdmin: defaultUserAdmin
            },
            req: {
                transactionID: tid
            }
        })
        await setUserSite(payload, tid, defaultUser, sites[0])

        await use(defaultUser)
    },
    payload,
})
