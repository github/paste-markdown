export interface OptionConfig {
  defaultPlainTextPaste?: PlainTextParams
}

interface PlainTextParams {
  urlLinks?: boolean

  // Not currently implemented behavior
  /*imageLinks?: boolean
  html?: boolean
  table?: boolean
  text?: boolean*/
}
