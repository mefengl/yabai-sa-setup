#!/usr/bin/env node

const os = require('node:os')
const process = require('node:process')
const { execSync } = require('node:child_process')
const sudo = require('sudo-prompt')

function getYabaiPath() {
  try {
    return execSync('which yabai').toString().trim()
  }
  catch (error) {
    console.error('Error finding yabai path:', error.message)
    process.exit(1)
  }
}

function getSha256Hash(path) {
  try {
    return execSync(`shasum -a 256 ${path}`).toString().split(' ')[0]
  }
  catch (error) {
    console.error('Error computing SHA256 hash:', error.message)
    process.exit(1)
  }
}

function restartYabai() {
  try {
    console.log('Restarting yabai service...')
    execSync('yabai --stop-service')
    execSync('yabai --start-service')
    console.log('Yabai service restarted successfully.')
  }
  catch (error) {
    console.error('Error restarting yabai service:', error.message)
  }
}

function setupSudoers(user, yabaiPath, hash) {
  const sudoersContent = `${user} ALL=(root) NOPASSWD: sha256:${hash} ${yabaiPath} --load-sa`
  console.log('Sudoers content to be added:')
  console.log(sudoersContent)

  const sudoersFilePath = '/private/etc/sudoers.d/yabai'
  const command = `echo '${sudoersContent}' | sudo tee ${sudoersFilePath}`

  sudo.exec(command, { name: 'Yabai Scripting Addition Setup' }, (error) => {
    if (error) {
      console.error('Error updating sudoers file:', error.message)
      process.exit(1)
    }
    console.log('Sudoers file updated successfully.')
    restartYabai()
  })
}

function main() {
  const user = os.userInfo().username
  const yabaiPath = getYabaiPath()
  const hash = getSha256Hash(yabaiPath)

  setupSudoers(user, yabaiPath, hash)
  console.log('Yabai scripting addition setup is in progress...')
}

main()
