import { Site, Post } from '@/payload-types'
import { BasePayload } from 'payload'

export interface LocalTestContext {
    transactions: Map<string, string | number>
}
