import { expect, describe } from 'vitest'
import { create, find, findByID, update, del } from '@test/utils/localHelpers';
import { test } from '@test/utils/test';
import { Site } from '@/payload-types';
import { siteIdHelper } from '@/utilities/idHelper';
import { isAccessError } from '@test/utils/errors';

describe('Users access',  () => {
    describe('admins can...', async () => {
        test.scoped({ defaultUserAdmin: true })

        test('read all Users', async ({ tid, testUser, users }) => {
            const foundUsers = await find(payload, tid, {
                collection: 'users'
            }, testUser)
            // the +1 represents the test user, not included in the fixture
            expect(foundUsers.docs).toHaveLength(users.length + 1)
        })

        test('write a User to any site', async ({ tid, testUser, sites }) => {
            const newUsers = await Promise.all(sites.map(async site => {
                return create(payload, tid, {
                    collection: 'users',
                    data: {
                        email: `newuser@${site.name}.gov`,
                        sites: [{
                            site,
                            role: 'user'
                        }]
                    }
                }, testUser)
            }))

            expect(newUsers).toHaveLength(sites.length)
        })

        test('update any User', async ({ tid, testUser, users }) => {
            const newUsers = await Promise.all(users.map(async user => {
                return update(payload, tid, {
                    collection: 'users',
                    id: user.id,
                    data: {
                        email: `${user.email} (Edited)`,
                    }
                }, testUser)

            }))

            newUsers.forEach(user => {
                expect(user.email).toContain('Edited')
            })
        })

        test('delete any User', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return del(payload, tid, {
                    collection: 'users',
                    id: user.id,
                }, testUser)
            }))

            const foundUsers = await find(payload, tid, {
                collection: 'users'
            })
            // test user remains
            expect(foundUsers.docs.length).toBe(1)
        })
    })

    describe('site managers can...', async () => {
        test.scoped({ defaultUserAdmin: false, defaultUserRole: 'manager' })

        test('read their Users', async ({ tid, testUser, users }) => {
            const siteId = siteIdHelper(testUser.sites[0].site)
            const foundUsers = await find(payload, tid, {
                collection: 'users'
            }, testUser)

            // created user, bot user, test user
            expect(foundUsers.docs).toHaveLength(3)
            foundUsers.docs.forEach(user => {
                expect(user.sites[0]).toHaveProperty('site.id', siteId)
            })
        })

        test('not read not-their Users', async ({ tid, testUser, users }) => {
            const notTheirUsers = users.filter(user => {
                siteIdHelper(user.sites[0].site) !== siteIdHelper(testUser.sites[0].site)
            })

            await Promise.all(notTheirUsers.map(async user => {
                return isAccessError(findByID(payload, tid, {
                    collection: 'users',
                    id: user.id
                }, testUser))
            }))
        })

        test('create a User for their site', async ({ tid, testUser }) => {
            const site = testUser.sites[0].site as Site
            const newUser = await create(payload, tid, {
                collection: 'users',
                data: {
                    email: `newuser@${site.name}.gov`,
                    sites: [{
                        site,
                        role: 'user'
                    }],
                }
            }, testUser)

            expect(newUser).toBeTruthy()
        })

        test('not create a User for not-their site', async ({ tid, testUser, sites }) => {
            const notTheirSites= sites.filter(site => {
                site.id !== siteIdHelper(testUser.sites[0].site)
            })

            await Promise.all(notTheirSites.map(async site => {
                return isAccessError(create(payload, tid, {
                    collection: 'users',
                    data: {
                        email: `newuser@${site.name}.gov`,
                        sites: [{
                            site,
                            role: 'user'
                        }],
                    }
                }, testUser))
            }))
        })

        test('update their Users', async ({ tid, testUser, users }) => {
            const theirUsers = (await find(payload, tid, {
                collection: 'users'
            }, testUser)).docs
            const newUsers = await Promise.all(theirUsers.map(async user => {
                return update(payload, tid, {
                    collection: 'users',
                    id: user.id,
                    data: {
                        sites: [{
                            site: user.sites[0].site,
                            role: 'manager'
                        }],
                    }
                }, testUser)
            }))

            newUsers.forEach(user => {
                expect(user.sites[0].role).toBe('manager')
            })
        })

        test('not update not-their Users', async ({ tid, testUser, users }) => {
            const theirUsers = (await find(payload, tid, {
                collection: 'users'
            }, testUser)).docs
            const notTheirUsers = users.filter(user => {
                return !theirUsers.map(u => u.id).includes(user.id)
            })

            await Promise.all(notTheirUsers.map(async user => {
                return isAccessError(update(payload, tid, {
                    collection: 'users',
                    id: user.id,
                    data: {
                        sites: [{
                            site: user.sites[0].site,
                            role: 'manager'
                        }],
                    }
                }, testUser))
            }))
        })

    //     test('delete their Users', async ({ tid, testUser, users }) => {
    //         const userUsers = (await find(payload, tid, {
    //             collection: 'users'
    //         }, testUser)).docs

    //         await Promise.all(userUsers.map(user => {
    //             return del(payload, tid, {
    //                 collection: 'users',
    //                 id: user.id,
    //             }, testUser)
    //         }))

    //         const foundUsers = await find(payload, tid, {
    //             collection: 'users'
    //         })
    //         expect(foundUsers.docs.length).toBe(users.length - userUsers.length)
    //     })

    //     test('not delete not-their Users', async ({ tid, testUser, users }) => {
    //         const siteId = siteIdHelper(testUser.sites[0].site)
    //         const notTheirUsers = (await find(payload, tid, {
    //             collection: 'users',
    //             where: {
    //                 'site.id': {
    //                     'not_equals': siteId
    //                 }
    //             }
    //         }, testUser)).docs

    //         notTheirUsers.forEach(user => {
    //             isAccessError(del(payload, tid, {
    //                 collection: 'users',
    //                 id: user.id
    //             }, testUser))
    //         })
    //     })
    })

    describe('site users can...', async () => {
        test.scoped({ defaultUserAdmin: false, defaultUserRole: 'user' })

        test('read their Users', async ({ tid, testUser, users }) => {
            const siteId = siteIdHelper(testUser.sites[0].site)
            const foundUsers = await find(payload, tid, {
                collection: 'users'
            }, testUser)

            // created user, bot user, test user
            expect(foundUsers.docs).toHaveLength(3)
            foundUsers.docs.forEach(user => {
                expect(user.sites[0]).toHaveProperty('site.id', siteId)
            })
        })

        test('not read not-their Users', async ({ tid, testUser, users }) => {
            const notTheirUsers = users.filter(user => {
                siteIdHelper(user.sites[0].site) !== siteIdHelper(testUser.sites[0].site)
            })

            await Promise.all(notTheirUsers.map(async user => {
                return isAccessError(findByID(payload, tid, {
                    collection: 'users',
                    id: user.id
                }, testUser))
            }))
        })

        test('not create a User', async ({ tid, testUser, sites }) => {
            await Promise.all(sites.map(async site => {
                return isAccessError(create(payload, tid, {
                    collection: 'users',
                    data: {
                        email: `newuser@${site.name}.gov`,
                        sites: [{
                            site,
                            role: 'user'
                        }],
                    }
                }, testUser))
            }))
        })

        test('not update a User', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return isAccessError(update(payload, tid, {
                    collection: 'users',
                    id: user.id,
                    data: {
                        sites: [{
                            site: user.sites[0].site,
                            role: 'manager'
                        }],
                    }
                }, testUser))
            }))
        })

        test('not delete a User', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return isAccessError(del(payload, tid, {
                    collection: 'users',
                    id: user.id
                }, testUser))
            }))
        })
    })

    describe('bots can...', async () => {
        test.scoped({ defaultUserAdmin: false, defaultUserRole: 'bot' })

        test('not read Users', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return isAccessError(findByID(payload, tid, {
                    collection: 'users',
                    id: user.id
                }, testUser))
            }))
        })

        test('not create a User', async ({ tid, testUser, sites }) => {
            await Promise.all(sites.map(async site => {
                return isAccessError(create(payload, tid, {
                    collection: 'users',
                    data: {
                        email: `newuser@${site.name}.gov`,
                        sites: [{
                            site,
                            role: 'user'
                        }],
                    }
                }, testUser))
            }))
        })

        test('not update a User', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return isAccessError(update(payload, tid, {
                    collection: 'users',
                    id: user.id,
                    data: {
                        sites: [{
                            site: user.sites[0].site,
                            role: 'manager'
                        }],
                    }
                }, testUser))
            }))
        })

        test('not delete a User', async ({ tid, testUser, users }) => {
            await Promise.all(users.map(async user => {
                return isAccessError(del(payload, tid, {
                    collection: 'users',
                    id: user.id
                }, testUser))
            }))
        })
    })
})
