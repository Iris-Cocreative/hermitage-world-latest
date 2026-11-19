/**
 * Collab Library: the shapes of the data, as the components and loaders see
 * them. Rows come from the library_* tables and the library_catalog view
 * (migrations/0001_collab_library.sql); `loadLibrary` assembles them into one
 * `LibraryData`.
 */

export type Shape = 'book' | 'article' | 'video' | 'audio' | 'album' | 'course' | 'practice' | 'stack' | 'paper'

export type Status = 'draft' | 'published' | 'archived'
export type Stage = 'seedling' | 'budding' | 'evergreen'

export interface ResourceType {
  key: string
  label: string
  plural: string
  action: string
  shape: Shape
  sort: number
  enabled: boolean
}

export interface Person {
  id: string
  slug: string
  name: string
  short_name: string
  role: string
}

export interface Topic {
  id: string
  slug: string
  name: string
  facet: string
  color: string | null
  sort: number
}

export interface RelationKind {
  key: string
  out_label: string
  in_label: string
  sort: number
}

export interface Credit {
  person: Person
  credit: string
}

/** A resource as the viewer may see it, with the host's offer beside it. */
export interface Resource {
  id: string
  slug: string
  type: string
  title: string
  subtitle: string
  blurb: string
  body: string
  status: Status
  audience: string
  stage: Stage | null
  url: string | null
  product_id: string | null
  cover_url: string | null
  minutes: number | null
  year: number | null
  featured: boolean
  sort: number
  meta: Record<string, unknown>
  published_at: string | null
  updated_at: string
  // from library_offer(): the host's product
  product_slug: string | null
  price_cents: number | null
  currency: string | null
  on_sale: boolean
  owned: boolean
  // assembled by loadLibrary
  credits: Credit[]
  topics: string[] // topic ids
}

export interface Relation {
  from_id: string
  to_id: string
  kind: string
  sort: number
}

export interface CollectionStop {
  resource_id: string
  note: string
}

export interface Collection {
  id: string
  slug: string
  title: string
  blurb: string
  by_line: string
  time_line: string
  status: Status
  sort: number
  stops: CollectionStop[]
}

export interface LibraryData {
  types: ResourceType[]
  topics: Topic[]
  people: Person[]
  kinds: RelationKind[]
  resources: Resource[]
  relations: Relation[]
  collections: Collection[]
}

/**
 * Where the library hands off to the host app. Every link the library draws
 * that isn't its own comes from here, so the same components serve any client.
 */
export interface LibraryHost {
  /** The library's own base path, with a trailing slash: /library/ */
  base: string
  /** A product's page in the host's store, where a price is paid or a free item claimed. */
  productHref: (productSlug: string) => string
  /** Where an owned product is opened (the person's own library or account). */
  ownedHref: string
  /** Sign in, then come back. */
  signInHref: (next: string) => string
  /** Whether someone is signed in (for the "for you" and owned states). */
  signedIn: boolean
  /** Format a price for display. */
  money: (cents: number, currency: string) => string
}

/** What a viewer can do with a resource right now. */
export type AccessState =
  | 'yours'    // they own the product behind it
  | 'free'     // a free product: claim it into their library
  | 'for-sale' // a product with a price
  | 'open'     // no product: it opens (a link, or read in place)
  | 'soon'     // nothing to open yet, or its product isn't on sale yet
