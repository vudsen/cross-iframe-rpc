import { expect, jest, test } from '@jest/globals'
import { createBridgePeerClient, createBridePeerClientWithTypeOnly } from 'iframe-bridge'
import { createSimpleMessagePoster } from './__util__'

// test('Send invoke message from client', (done) => {
//   const iframe = document.createElement("iframe");
//   document.body.appendChild(iframe);
//   const childWindow = iframe.contentWindow!
//
//   const cb = {
//     nested: {
//       method: jest.fn()
//     }
//   }
//
//   addEventListener('message', ev => {
//     console.log(ev.data)
//     done()
//   })
//
//   const client = createBridgePeerClient(childWindow.parent)
//   client.postMessage('123')
// })

test('Test basic invoke', async () => {
  const testObj = {
    a: 1,
    b: 'b',
    c: ['a'],
    d: ['d', 1],
    f: {
      g: {
        h: '1',
        i: 'jj'
      }
    }
  }

  const fn = jest.fn()
  const remoteObj = {
    nested: {
      method: (): Promise<void> => {
        return new Promise((resolve) => {
          fn()
          resolve()
        })
      },
      withArgs: (arg: string) => {
        return new Promise((resolve) => {
          resolve({
            ...testObj,
            custom: arg
          })
        })
      }
    }
  }

  const { posterA,posterB } = createSimpleMessagePoster()

  createBridgePeerClient({
    poster: posterA,
    target: remoteObj
  })
  const iframe = createBridePeerClientWithTypeOnly<typeof remoteObj>({
    poster: posterB,
  })

  await Promise.all([
    iframe.nested.method().then(() => {
      expect(fn).toBeCalled()
    }),
    iframe.nested.withArgs('hello').then((r) => {
      expect(r).toStrictEqual({
        ...testObj,
        custom: 'hello'
      })
    })
  ])
})

test('Test callback', (done) => {
  const remoteObj = {
    callback: (cb: (s: string) => void, arg: string) => {
      cb(arg)
    }
  }

  const { posterA,posterB } = createSimpleMessagePoster()
  createBridgePeerClient({
    poster: posterA,
    target: remoteObj
  })
  const iframe = createBridePeerClientWithTypeOnly<typeof remoteObj>({
    poster: posterB,
  })

  const val = 'hello'
  iframe.callback(s => {
    expect(s).toBe(val)
    done()
  }, val)
})

test('Test remove listener', () => {
  const { posterA: server, posterB: client  } = createSimpleMessagePoster()
  const fn = jest.fn()

  const { posterA, posterB } = createSimpleMessagePoster()

  createBridgePeerClient({
    poster: posterA,
    target: server
  })
  const iframe = createBridePeerClientWithTypeOnly<typeof server>({
    poster: posterB,
  })

  iframe.addEventListener('message', fn)
  client.postMessage('')
  iframe.removeEventListener('message', fn)
  client.postMessage('')
  expect(fn).toBeCalledTimes(1)
})