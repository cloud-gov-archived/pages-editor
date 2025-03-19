import { User, Site } from "@/payload-types"
import { BasePayload, CollectionSlug, PayloadRequest, SelectType } from "payload"
import type { Options as CreateOptions } from "node_modules/payload/dist/collections/operations/local/create"
import type { Options as FindOptions } from "node_modules/payload/dist/collections/operations/local/find"

const siteKey = 'site-key'

// TODO: generalize these functions for other local methods; it's hard to type
export async function create<TSlug extends CollectionSlug, TSelect extends SelectType>(
    payload: BasePayload,
    tid: string | number | undefined,
    options: CreateOptions<TSlug, TSelect>,
    user?: User) {
    let localOptions = { ...options }
    if (tid) {
       localOptions = { ...localOptions, req: { transactionID: tid } }
    }
    if (user) {
        localOptions = { ...localOptions, overrideAccess: false, user }
    }

  return payload.create(localOptions)
}

export async function find<TSlug extends CollectionSlug, TSelect extends SelectType>(
    payload: BasePayload,
    tid: string | number | undefined,
    options: FindOptions<TSlug, TSelect>,
    user?: User) {
    let localOptions = { ...options }
    if (tid) {
       localOptions = { ...localOptions, req: { transactionID: tid } }
    }
    if (user) {
        localOptions = { ...localOptions, overrideAccess: false, user }
    }

  return payload.find(localOptions)
}

export async function setUserSite(
    payload: BasePayload,
    tid: string | number,
    user: User,
    site: Site,
) {

    let req: Partial<PayloadRequest> = {
      user: { ...user, collection: 'users' }
    }

    if (tid) {
      req = { ...req, transactionID: tid }
    }

    return payload.create({
        collection: 'payload-preferences',
        data: {
          key: siteKey,
          user: {
            relationTo: 'users',
            value: user.id
          },
          value: site.id
        },
        req
      })
}
