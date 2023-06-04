
//  动态导入Editor组件
import dynamic from 'next/dynamic'
const Editor = dynamic(() => import('../components/Editor'), { ssr: false })

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
      <Editor/>
    </main>
  )
}
