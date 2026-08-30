import { httpRouter } from 'convex/server'
import { auth } from './auth'
import { oauthCallback } from './trakt'

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: '/trakt/callback',
  method: 'GET',
  handler: oauthCallback
})

export default http
