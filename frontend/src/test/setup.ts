// automatically executed before each test file in the project 
// sets up testing env, adds browser Jest matchers. 

import '@testing-library/jest-dom/jest-globals'
import { TextDecoder, TextEncoder } from 'node:util'

Object.assign(globalThis, { TextDecoder, TextEncoder })
