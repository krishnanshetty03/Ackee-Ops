import type { DemoCredential } from './types'

// Demo-only, deliberately visible credentials — this is a local prototype with
// no backend, so "auth" exists purely to show the login step a real ops/driver
// app would have. Never a pattern for anything with real data behind it.
export const STAFF_CREDENTIAL: DemoCredential = {
  username: 'adjoa@tallawahfoods.com',
  password: 'demo1234',
}

export const DRIVER_CREDENTIAL: DemoCredential = {
  username: 'driver@tallawahfoods.com',
  password: 'demo1234',
}

export const MD_CREDENTIAL: DemoCredential = {
  username: 'md@tallawahfoods.com',
  password: 'demo1234',
}
