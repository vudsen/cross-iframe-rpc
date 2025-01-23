// debug logging
let loggerEnable = true


export const setLoggerEnabled = (enabled: boolean): void => {
  loggerEnable = enabled
}


export const info = (...obj: unknown[]) => {
  if (loggerEnable) {
    console.log('Bridge Message:', ...obj)
  }
}