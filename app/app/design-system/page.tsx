import type { Metadata } from 'next'
import DesignSystemShowcase from './DesignSystemShowcase'

export const metadata: Metadata = { title: 'Design system' }

/** /design-system — living reference of the design tokens and reusable components. */
export default function DesignSystemPage() {
    return <DesignSystemShowcase />
}
