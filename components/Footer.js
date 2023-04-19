import { useConfig } from '@/lib/config'
import Vercel from '@/components/Vercel'
const Footer = ({ fullWidth }) => {
  const BLOG = useConfig()

  const d = new Date()
  const y = d.getFullYear()
  const from = +BLOG.since
  return (
    <div
      className={`mt-40 flex-shrink-0 m-auto w-full text-gray-500 dark:text-gray-400 transition-all`}
    >
      <div className="my-4 text-sm leading-6">
        <div className="flex align-baseline justify-between flex-wrap px-8">
          <p>
            © {BLOG.author} {from === y || !from ? y : `${from} - ${y}`}
          </p>
          {/* <Vercel /> */}
        </div>
      </div>
    </div>
  )
}

export default Footer
