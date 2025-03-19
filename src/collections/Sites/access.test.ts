import { expect, describe } from 'vitest'
import { create, find, setUserSite } from '@test/utils/localHelpers';
import { test } from '@test/utils/test'

async function createSites(payload, tid, names: string[]) {
    return Promise.all(names.map(async name => {
        return create(payload, tid, {
            collection: 'sites',
            data: {
                name
            },
        })
    }))
}

describe('Sites access',  () => {
    test('admins can read all Sites',  async ({ tid }) => {
        const sites = await createSites(payload, tid, ['site1', 'site2'])

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

        const foundSites = await find(payload, tid, {
            collection: 'sites'
        }, user)
        expect(foundSites.docs).toHaveLength(sites.length)
    })

    test('site users can read their Site only',  async ({ tid }) => {
        const sites = await createSites(payload, tid, ['site1', 'site2'])

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

        const foundSites = await find(payload, tid, {
            collection: 'sites'
        }, user)

        expect(foundSites.docs).toHaveLength(1)
        expect(foundSites.docs[0]).toHaveProperty('name', site1.name)
    })

    test('site users can only read if a site is selected',  async ({ tid }) => {
        const sites = await createSites(payload, tid, ['site1', 'site2'])

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
            collection: 'sites'
        }, user)).rejects.toThrowError('You are not allowed to perform this action')
    })
})
