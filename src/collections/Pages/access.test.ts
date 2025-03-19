import { expect, describe, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { create, find, setUserSite } from '@test/utils/localHelpers';
import type { Page, Site } from '@/payload-types';
import { test } from '@test/utils/test';

async function createPage(payload, tid, site, title) {
    return create(payload, tid, {
        collection: 'pages',
        data: {
            title,
            site
        }
    })
}

describe('Pages access',  () => {

    let sites: Site[]
    let pages: Page[]

    beforeAll(async () => {
        const names = ['site1', 'site2', 'site3']
        sites = await Promise.all(names.map(async name => {
            return create(payload, undefined, {
                collection: 'sites',
                data: {
                    name
                }
            })
        }))

    })

    beforeEach(async() => {
        pages = await Promise.all(sites.map(async site => {
            return create(payload, undefined, {
                collection: 'pages',
                data: {
                    title: `${site.name} Title`,
                    site
                }
            })
        }))
    })

    afterEach(async () => {
        const del = await payload.delete({
            collection: 'pages',
            where: {}
        })
    })

    afterAll(async () => {

        await payload.delete({
            collection: 'users',
            where: {}
        })
        return payload.delete({
            collection: 'sites',
            where: {}
        })
    })


    describe('admins can...', async () => {

        test('...read all Pages', async ({ transactions }) => {
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

            const foundPages = await find(payload, tid, {
                collection: 'pages'
            }, user)
            expect(foundPages.docs).toHaveLength(pages.length)
        })

        test('...another fake thing', async () => {
            expect(true).toBeTruthy()
        })
    })

    // test('site users can read their Pages only', async ({ transactions, payload, sites }) => {
    //     const tid = transactions.get('tid') ?? 1
    //     await Promise.all(sites.map(async site => {
    //         return createPage(payload, tid, site, 'New Page')
    //     }))

    //     const [site1] = sites

    //     const user = await create(payload, tid, {
    //         collection: 'users',
    //         data: {
    //             email: 'user@example.gov',
    //             sites: [{
    //                 site: site1,
    //                 role: 'user'
    //             }],
    //         }
    //     })
    //     await setUserSite(payload, tid, user, site1)

    //     const foundPages = await find(payload, tid, {
    //         collection: 'pages'
    //     }, user)

    //     expect(foundPages.docs).toHaveLength(1)
    //     expect(foundPages.docs[0]).toHaveProperty('site.name', site1.name)
    // })

    // test('site users can only read if a site is selected', async ({ transactions, payload, sites }) => {
    //     const tid = transactions.get('tid') ?? 1
    //     await Promise.all(sites.map(async site => {
    //         return createPage(payload, tid, site, 'New Page')
    //     }))

    //     const [site1] = sites

    //     const user = await create(payload, tid, {
    //         collection: 'users',
    //         data: {
    //             email: 'user@example.gov',
    //             sites: [{
    //                 site: site1,
    //                 role: 'user'
    //             }],
    //         }
    //     })

    //     await expect(find(payload, tid, {
    //         collection: 'pages'
    //     }, user)).rejects.toThrowError('You are not allowed to perform this action')
    // })
})
