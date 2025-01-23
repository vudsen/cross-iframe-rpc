import { expect, jest, test } from '@jest/globals'
import { createBridgePeerClient, createBridePeerClientWithTypeOnly, accessProperty } from 'cross-iframe-rpc'
import { createClientAndServer, createSimpleMessagePoster } from './__util__'


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

test('Test multiple bridge', () => {
  const fnA = jest.fn()
  const fnB = jest.fn()
  const apple = {
    method: () => {
      fnA()
    }
  }
  const orange: typeof apple = {
    method: () => {
      fnB()
    }
  }
  
  const { posterA, posterB } = createSimpleMessagePoster()
  
  createBridgePeerClient({
    target: apple,
    poster: posterA,
    key: 'apple'
  })
  const appleClient = createBridePeerClientWithTypeOnly<typeof apple>({
    poster: posterB,
    key: 'apple'
  })
  
  createBridgePeerClient({
    target: orange,
    poster: posterA,
    key: 'orange'
  })
  const orangeClient = createBridePeerClientWithTypeOnly<typeof orange>({
    poster: posterB,
    key: 'orange'
  })
  appleClient.method()
  orangeClient.method()
  expect(fnA).toBeCalledTimes(1)
  expect(fnB).toBeCalledTimes(1)
})

test('Test property access', async () => {
  const fruit = {
    round: {
      apple: 'yummy!'
    }
  }

  const { client } = createClientAndServer(fruit)

  expect(await accessProperty(client.round.apple)).toBe('yummy!')
})


test('Test callback remove', async () => {
  type Listener = () => void

  function createRemoteObj() {
    let listener: Listener | undefined
    return {
      addListener: (lis: Listener) => {
        listener = lis
      },
      removeListener: (lis: Listener) => {
        if (lis === listener) {
          listener = undefined
        }
      },
      getListener: () => {
        return listener
      },
      invokeListener: () => {
        listener?.()
      }
    }
  }
  const remote = createRemoteObj()
  const { client } = createClientAndServer(remote)

  const fn = jest.fn()
  const lis = () => {
    fn()
  }
  client.addListener(lis)
  client.invokeListener()
  expect(fn).toBeCalledTimes(1)
  client.removeListener(lis)
  client.invokeListener()
  expect(fn).toBeCalledTimes(1)
  expect(remote.getListener()).toBeFalsy()
})