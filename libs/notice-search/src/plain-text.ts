import { htmlToText } from 'html-to-text';

export const extractPlainText = (html: string): string =>
  htmlToText(html, {
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  });
