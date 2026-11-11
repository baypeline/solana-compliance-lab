#!/usr/bin/env python3
"""Build one offline HTML with CSS, JS, captured JSON and an OFL-licensed font."""
import base64
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def main():
    data = json.loads((HERE / 'data/demo.json').read_text())
    if data.get('format') != 'scl-presentation' or len(data.get('scenarios', [])) != 5:
        raise ValueError('Export and validate the presentation data first')
    font = (HERE / 'vendor/PretendardVariable.woff2').read_bytes()
    if not font.startswith(b'wOF2'):
        raise ValueError('Not a WOFF2 font')
    css = ((HERE / 'src/deck.css').read_text() + '\n' + (HERE / 'src/visuals.css').read_text()).replace('/*INLINE_FONT*/', base64.b64encode(font).decode())
    html = (HERE / 'src/deck.html').read_text()
    for token, value in {
        '/*INLINE_STYLE*/': css,
        '/*INLINE_DATA*/': json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c'),
        '/*INLINE_NOTES*/': json.dumps(json.loads((HERE / 'src/notes.json').read_text()), ensure_ascii=False).replace('<', '\\u003c'),
        '/*INLINE_SCRIPT*/': (HERE / 'src/deck.js').read_text() + '\n' + (HERE / 'src/visuals.js').read_text(),
        '/*FONT_LICENSE*/': (HERE / 'vendor/Pretendard-LICENSE.txt').read_text().replace('<', '&lt;'),
    }.items():
        if html.count(token) != 1:
            raise ValueError('Missing or duplicate build token: ' + token)
        html = html.replace(token, value)
    target = HERE / 'index.html'
    target.write_text(html)
    print(f'Built {target} ({target.stat().st_size:,} bytes)')

if __name__ == '__main__':
    main()
