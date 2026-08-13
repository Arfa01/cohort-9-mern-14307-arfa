export function getNotePlainText(content: string): string {
  const parsed = new DOMParser().parseFromString(content, 'text/html')

  parsed
    .querySelectorAll('script, style, noscript, template')
    .forEach((element) => element.remove())

  parsed
    .querySelectorAll(
      'br, p, div, h1, h2, h3, h4, h5, h6, blockquote, li, pre',
    )

    .forEach((element) => element.append(' '))

  return parsed.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}
