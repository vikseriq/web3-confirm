import {mkdir} from 'node:fs/promises'
import zipper from 'zip-local'

try {
  await mkdir('./dist')
} catch (e) {
  // dist exists
}

zipper.zip('./src', function(error, zipped) {
  zipped.compress()

  zipped.save('./dist/web3-confirm.zip', function(error) {
    if (!error) {
      console.log('plugin packed')
    } else {
      console.log('unable to pack: ', error)
    }
  })
})
