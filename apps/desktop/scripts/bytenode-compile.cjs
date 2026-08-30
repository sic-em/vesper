const bytenode = require('bytenode')
const path = require('path')

const file = process.argv[2]
if (!file) {
  console.error('usage: bytenode-compile <file.js>')
  process.exit(1)
}

bytenode
  .compileFile({
    filename: path.resolve(file),
    compileAsModule: true,
    electron: true
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
