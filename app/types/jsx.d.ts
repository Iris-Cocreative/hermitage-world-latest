import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type HW = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

/**
 * The site's custom elements (assets/js/site.js for the main.css pages,
 * assets/js/hw.js for the Trellis pages) render themselves once the
 * browser reaches them. React leaves their insides alone: each is rendered
 * with dangerouslySetInnerHTML="" and suppressHydrationWarning.
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hw-header': HW & { variant?: 'overlay' }
      'hw-footer': HW
      'hw-signup': HW
      'hw-mark': HW & { label?: string; still?: '' | boolean }
      'hw-bar': HW & { variant?: 'overlay'; 'data-account'?: 'none' | 'member' | 'staff' }
      'hw-letter': HW
      'hw-foot': HW
    }
  }
}
