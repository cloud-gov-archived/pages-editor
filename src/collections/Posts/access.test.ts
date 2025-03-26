import { expect, describe } from 'vitest'
import { create, find, findByID, update, del } from '@test/utils/localHelpers';
import { test } from '@test/utils/test';
import { Site } from '@/payload-types';

const isAccessError = (fnCall) => {
    expect(fnCall)
    .rejects
    .toThrowError('You are not allowed to perform this action')
}

const getSiteId = (site: Site | number) => {
    if (typeof site === 'number') return site
    return site.id
}

describe('Posts access',  () => {
    describe('admins can...', async () => {
        test.scoped({ defaultUserAdmin: true })

        test('read all Posts', async ({ tid, testUser, posts }) => {
            const foundPosts = await find(payload, tid, {
                collection: 'posts'
            }, testUser)
            expect(foundPosts.docs).toHaveLength(posts.length)
        })

        test('write a Post to any site', async ({ tid, testUser, sites }) => {
            const newPosts = await Promise.all(sites.map(async site => {
                return create(payload, tid, {
                    collection: 'posts',
                    data: {
                        title: `${site.name} - Title`,
                        site,
                    }
                }, testUser)
            }))

            expect(newPosts).toHaveLength(sites.length)
        })

        test('update any Post', async ({ tid, testUser, posts }) => {
            const newPosts = await Promise.all(posts.map(async post => {
                return update(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                    data: {
                        title: `${post.title} (Edited)`,
                    }
                }, testUser)

            }))

            newPosts.forEach(post => {
                expect(post.title).toContain('Edited')
            })

        })

        test('delete any Post', async ({ tid, testUser, posts }) => {
            await Promise.all(posts.map(async post => {
                return del(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                }, testUser)

            }))

            const foundPosts = await find(payload, tid, {
                collection: 'posts'
            })
            expect(foundPosts.docs.length).toBe(0)
        })
    })

    describe('site users can...', async () => {
        // TODO: this is a bug in https://github.com/vitest-dev/vitest/pull/7233
        test.scoped({ defaultUserAdmin: false })

        test('read their Posts', async ({ tid, testUser, posts }) => {
            const foundPosts = await find(payload, tid, {
                collection: 'posts'
            }, testUser)
            expect(foundPosts.docs).toHaveLength(1)
            expect(foundPosts.docs[0].site).toStrictEqual(testUser.sites[0].site)
        })

        test('not read not-their Posts', async ({ tid, testUser, posts }) => {
            const notTheirPosts = posts.filter(post => {
                getSiteId(post.site) !== getSiteId(testUser.sites[0].site)
            })

            notTheirPosts.forEach(post => {
                isAccessError(findByID(payload, tid, {
                    collection: 'posts',
                    id: post.id
                }, testUser))
            })
        })

        test('write a Post to their site', async ({ tid, testUser }) => {
            const site = testUser.sites[0].site as Site
            const newPost = await create(payload, tid, {
                collection: 'posts',
                data: {
                    title: `${site.name} - Title`,
                    site,
                }
            }, testUser)

            expect(newPost).toBeTruthy()
        })

        test('not write a Post to not-their site', async ({ tid, testUser, sites }) => {
            const notTheirSites= sites.filter(site => {
                site.id !== getSiteId(testUser.sites[0].site)
            })

            notTheirSites.forEach(site => {
                isAccessError(create(payload, tid, {
                    collection: 'posts',
                    data: {
                        title: `${site.name} - Title`,
                        site,
                    }
                }, testUser))
            })
        })

        test('update their Posts', async ({ tid, testUser, posts }) => {
            const theirPosts = (await find(payload, tid, {
                collection: 'posts'
            }, testUser)).docs
            const newPosts = await Promise.all(theirPosts.map(async post => {
                return update(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                    data: {
                        title: `${post.title} (Edited)`,
                    }
                }, testUser)

            }))

            newPosts.forEach(post => {
                expect(post.title).toContain('Edited')
            })
        })

        test('not update not-their Posts', async ({ tid, testUser, posts }) => {
            const siteId = getSiteId(testUser.sites[0].site)
            const notTheirPosts = (await find(payload, tid, {
                collection: 'posts',
                where: {
                    'site.id': {
                        'not_equals': siteId
                    }
                }
            }, testUser)).docs

            notTheirPosts.forEach(post => {
                isAccessError(update(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                    data: {
                        title: `${post.title} (Edited)`,
                    }
                }, testUser))
            })
        })

        test('delete their Posts', async ({ tid, testUser, posts }) => {
            const userPosts = (await find(payload, tid, {
                collection: 'posts'
            }, testUser)).docs

            await Promise.all(userPosts.map(post => {
                return del(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                }, testUser)
            }))

            const foundPosts = await find(payload, tid, {
                collection: 'posts'
            })
            expect(foundPosts.docs.length).toBe(posts.length - userPosts.length)
        })

        test('not delete not-their Posts', async ({ tid, testUser, posts }) => {
            const siteId = getSiteId(testUser.sites[0].site)
            const notTheirPosts = (await find(payload, tid, {
                collection: 'posts',
                where: {
                    'site.id': {
                        'not_equals': siteId
                    }
                }
            }, testUser)).docs

            notTheirPosts.forEach(post => {
                isAccessError(del(payload, tid, {
                    collection: 'posts',
                    id: post.id
                }, testUser))
            })
        })
    })

    describe('bots can...', async () => {
        test.scoped({ defaultUserAdmin: false, defaultUserRole: 'bot' })

        test('read their Posts', async ({ tid, testUser, posts }) => {
            const foundPosts = await find(payload, tid, {
                collection: 'posts'
            }, testUser)
            expect(foundPosts.docs).toHaveLength(1)
            expect(getSiteId(foundPosts.docs[0].site)).toStrictEqual(getSiteId(testUser.sites[0].site))
        })

        test('not read not-their Posts', async ({ tid, testUser, posts }) => {
            const notTheirPosts = posts.filter(post => {
                getSiteId(post.site) !== getSiteId(testUser.sites[0].site)
            })

            notTheirPosts.forEach(post => {
                isAccessError(findByID(payload, tid, {
                    collection: 'posts',
                    id: post.id
                }, testUser))
            })
        })

        test('not write a Post', async ({ tid, testUser, sites }) => {
            sites.forEach(site => {
                isAccessError(create(payload, tid, {
                    collection: 'posts',
                    data: {
                        title: `${site.name} - Title`,
                        site,
                    }
                }, testUser))
            })
        })

        test('not update Posts', async ({ tid, testUser, posts }) => {
            posts.forEach(post => {
                isAccessError(update(payload, tid, {
                    collection: 'posts',
                    id: post.id,
                    data: {
                        title: `${post.title} (Edited)`,
                    }
                }, testUser))
            })
        })

        test('not delete Posts', async ({ tid, testUser, posts }) => {
            posts.forEach(post => {
                isAccessError(del(payload, tid, {
                    collection: 'posts',
                    id: post.id
                }, testUser))
            })
        })
    })
})
