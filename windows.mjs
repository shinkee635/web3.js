import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execSync } from 'node:child_process'

export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

// git ls-files -s | awk '/120000/{print $4}' > symlinks.txt

// const stdout = execSync('git ls-files -s | awk \'/120000/{print $4}\'', { windowsHide: true })
// console.log(stdout)
// fs.writeFileSync('symlinks.txt', stdout)

let symlinks_error = false
const stdout = fs.readFileSync('symlinks.txt', { encoding: 'utf8', flag: 'r' })
const files = stdout.trim().split('\n')
for (const file of files) {
    const link = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
    const link_cl = link.replace(/^(\.\.\/)+/g, '')
    fs.rm(file, { force: true }, (e) => {
        if (!e) {
            execSync(`mklink ${ path.join(__dirname, file) } ${ path.join(__dirname, link_cl) }`)
        }
        else {
            symlinks_error = true
        }
    })
}

if (!symlinks_error) {
    function* walk_sync(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true })
        for (const file of files) {
            const { name, path: link } = file
            const file_path = path.join(dir, name)
            if (file.isDirectory()) {
                yield* walk_sync(file_path)
            }
            else {
                if (name === 'package.json' && link.search('node_modules') === -1) {
                    const data = fs.readFileSync(file_path, { encoding: 'utf8', flag: 'r' })
                    const result = data.replace(/echo\s('|\\")(.*?)('|\\")\s>/g, 'echo \$2 >')
                    fs.writeFileSync(file_path, result, { encoding: 'utf8', flag: 'w+' })
                    yield file_path
                }
            }
        }
    }

    walk_sync(__dirname)
}