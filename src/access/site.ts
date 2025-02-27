import type { Access } from 'payload'
import type { Where } from 'payload'

// Access control function signatures by method:
// create: req, data
// read: req, id
// update: req, id, data
// delete: req, id

export const site: Access = ({ req: { user }, data }) => {
  if (!user) return false
  // if the user doesn't have access to the site in the
  // new data (create/update), deny access
  if (!user.sites.includes(data?.site)) {
    return false
  }
  // pass a query ensuring the user has access to the prior
  // data, matching on site
  const query: Where = {
    site: {
      in: user.sites.join()
    }
  }
  return query
}
