import { expect, describe } from 'vitest'
import { create, find, setUserSite } from '@test/utils/localHelpers';
import { test } from '@test/utils/test'
import { roles } from '@/collections/Users'

async function createUser(payload, tid, site, role) {
    return create(payload, tid, {
        collection: 'users',
        data: {
            email: `${site.name}-${role}@example.gov`,
            sites: [{
                site,
                role
            }]
        }
    })
}

describe('Users access',  () => {
    test('admins can read all Users', async ({ transactions, payload, sites }) => {
        const tid = transactions.get('tid') ?? 1
        // should create (sites.length * roles.length) users
        // in total there will be (sites.length * (roles.length + 1))
        // because each site automatically creates a bot user
        await Promise.all(sites.map(async site => {
            return Promise.all(roles.map(async role => {
                return createUser(payload, tid, site, role)
            }))
        }))

        const [site1] = sites

        const user = await create(payload, tid, {
            collection: 'users',
            data: {
                email: 'admin@example.gov',
                sites: [{
                    site: site1,
                    role: 'manager'
                }],
                isAdmin: true
            }
        })
        await setUserSite(payload, tid, user, site1)

        const foundUsers = await find(payload, tid, {
            collection: 'users',
            limit: 100
        }, user)

        expect(foundUsers.docs).toHaveLength(sites.length * (roles.length + 1) + 1)
    })

    test('site users can read their users only', async ({ transactions, payload, sites }) => {
        const tid = transactions.get('tid') ?? 1
        await Promise.all(sites.map(async site => {
            return Promise.all(roles.map(async role => {
                return createUser(payload, tid, site, role)
            }))
        }))

        const [site1] = sites

        const user = await create(payload, tid, {
            collection: 'users',
            data: {
                email: 'user@example.gov',
                sites: [{
                    site: site1,
                    role: 'user'
                }],
            }
        })
        await setUserSite(payload, tid, user, site1)

        const foundUsers = await find(payload, tid, {
            collection: 'users'
        }, user)

        expect(foundUsers.docs).toHaveLength(roles.length + 2)
        foundUsers.docs.forEach(foundUser => {
            expect(foundUser.sites[0]).toHaveProperty('site.name', site1.name)
        })
    })

    test('site users can only read if a site is selected', async ({ transactions, payload, sites }) => {
        const tid = transactions.get('tid') ?? 1

        const [site1] = sites

        const user = await create(payload, tid, {
            collection: 'users',
            data: {
                email: 'user@example.gov',
                sites: [{
                    site: site1,
                    role: 'user'
                }],
            }
        })

        await expect(find(payload, tid, {
            collection: 'users'
        }, user)).rejects.toThrowError('You are not allowed to perform this action')
    })
})
