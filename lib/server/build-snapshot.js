import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

// Each build gets a temporary directory shared by Next's workers. ISR only uses
// the in-process TTL cache; scripts/build.mjs removes the directory on exit.
export async function withBuildSnapshot (key, load, directory = process.env.NOTION_BUILD_CACHE_DIR) {
  if (!directory) return load()
  const file = join(directory, `${key}.json`)
  const lock = `${file}.lock`
  const deadline = Date.now() + 120_000
  while (true) {
    try { return JSON.parse(await readFile(file, 'utf8')) } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    try { await mkdir(lock) } catch (error) {
      if (error.code !== 'EEXIST') throw error
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for content snapshot: ${key}`)
      await new Promise(resolve => setTimeout(resolve, 100))
      continue
    }
    try {
      try { return JSON.parse(await readFile(file, 'utf8')) } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      const value = await load()
      await writeFile(`${file}.tmp`, JSON.stringify(value))
      await rename(`${file}.tmp`, file)
      return value
    } finally { await rm(lock, { recursive: true, force: true }) }
  }
}
