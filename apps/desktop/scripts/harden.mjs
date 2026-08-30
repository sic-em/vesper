#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import JavaScriptObfuscator from 'javascript-obfuscator'

const require = createRequire(import.meta.url)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'out')

const OBFUSCATE_OPTS = {
  target: 'node',
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.8,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  identifierNamesGenerator: 'mangled-shuffled',
  numbersToExpressions: true,
  renameGlobals: true,
  renameProperties: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 6,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayShuffle: true,
  stringArrayRotate: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.9,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  sourceMap: false
}

function obfuscateFile(file) {
  const src = fs.readFileSync(file, 'utf8')
  const obf = JavaScriptObfuscator.obfuscate(src, OBFUSCATE_OPTS).getObfuscatedCode()
  fs.writeFileSync(file, obf)
  process.stdout.write(
    `obfuscated ${path.relative(ROOT, file)} (${src.length} → ${obf.length} bytes)\n`
  )
}

function compileBytenode(mainOut, payloadOut) {
  fs.renameSync(mainOut, payloadOut)
  const compileScript = path.join(ROOT, 'scripts', 'bytenode-compile.cjs')
  const electronBin = require('electron')
  if (typeof electronBin !== 'string') {
    throw new Error('electron module did not export binary path')
  }
  const res = spawnSync(electronBin, [compileScript, payloadOut], {
    encoding: 'utf8',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  })
  if (res.status !== 0) {
    fs.renameSync(payloadOut, mainOut)
    throw new Error(`bytenode compile failed:\n${res.stderr || res.stdout}`)
  }
  const jscPath = payloadOut.replace(/\.js$/, '.jsc')
  if (!fs.existsSync(jscPath)) {
    throw new Error(`bytenode did not produce ${jscPath}`)
  }
  fs.unlinkSync(payloadOut)
  const stub = `'use strict';\nrequire('bytenode');\nrequire('./${path.basename(jscPath)}');\n`
  fs.writeFileSync(mainOut, stub)
  process.stdout.write(`bytenode compiled ${path.relative(ROOT, jscPath)}\n`)
}

async function main() {
  const mainOut = path.join(OUT, 'main', 'index.js')
  const preloadOut = path.join(OUT, 'preload', 'index.js')

  if (!fs.existsSync(mainOut)) throw new Error(`missing ${mainOut} — run electron-vite build first`)
  if (!fs.existsSync(preloadOut))
    throw new Error(`missing ${preloadOut} — run electron-vite build first`)

  obfuscateFile(mainOut)
  obfuscateFile(preloadOut)

  if (process.env.HARDEN_NO_BYTENODE === '1') {
    process.stdout.write('bytenode skipped (HARDEN_NO_BYTENODE=1)\n')
    return
  }

  const payloadOut = path.join(OUT, 'main', 'payload.js')
  compileBytenode(mainOut, payloadOut)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
