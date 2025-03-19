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

async function createPage(payload, tid, site, title) {
    return create(payload, tid, {
        collection: 'posts',
        data: {
            title,
            site
        }
    })
}

describe('Posts access',  () => {
    test('admins can read all Posts',  async ({ transactions, payload, sites, posts }) => {
        const tid = transactions.get('tid') ?? 1

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

        const foundPosts = await find(payload, tid, {
            collection: 'posts'
        }, user)
        expect(foundPosts.docs).toHaveLength(posts.length)
    })

    test('site users can read their Posts only', async ({ transactions, payload, sites }) => {
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
        await setUserSite(payload, tid, user, site1)

        const foundPosts = await find(payload, tid, {
            collection: 'posts'
        }, user)

        expect(foundPosts.docs).toHaveLength(1)
        expect(foundPosts.docs[0]).toHaveProperty('site.name', site1.name)
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
            collection: 'posts'
        }, user)).rejects.toThrowError('You are not allowed to perform this action')
    })
})
