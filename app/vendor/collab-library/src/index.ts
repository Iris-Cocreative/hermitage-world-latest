/**
 * Collab Library: the public surface. A host imports from here:
 *   import { Library, Detail, loadLibrary, saveResource } from '<vendor>/collab-library/src/index.ts'
 * and loads src/library.css after Trellis core.css and its product layer.
 */
export * from './types.ts'
export * from './logic.ts'
export * from './data.ts'
export { Shape, hueOf } from './components/Shape.tsx'
export { Detail, countOf, href } from './components/Detail.tsx'
export { ResourceForm, CollectionForm, TypesForm, type HostProduct } from './admin/forms.tsx'
export { Library, type LibraryProps } from './components/Library.tsx'
