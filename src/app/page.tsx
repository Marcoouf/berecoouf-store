import dynamic from 'next/dynamic'

const Site = dynamic(() => import('@/components/UI'), { ssr: false })

export default function Page() {
  return <Site />
}
