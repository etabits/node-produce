# produce - WIP
> A multi-rule multi-purpose source/target agnostic configurable transformer

[![Build Status](https://travis-ci.org/etabits/node-produce.svg?branch=master)](https://travis-ci.org/etabits/node-produce) [![Coverage Status](https://coveralls.io/repos/github/etabits/node-produce/badge.svg?branch=master)](https://coveralls.io/github/etabits/node-produce?branch=master)

*This module and documentation is still considered work-in-progress. Only no config example is added below for a preview*

## No Configuration
Install required plugins and it will automatically use them to produce output/serve content

Example: https://github.com/aularon/produce-example-no-conf

## Simple conf
```
less: less | add_header_note(preview) | yuicompressor(dist) > css
pug,jade: pug | add_header_note(preview) > html
js: babel | add_header_note(preview) | closure > js
```

## Advanced conf
```js
{
  rules: [
    {
      source: /\.(pug|jade)$/,
      via: [
        'pug',
        {
          processor: 'add_header_note',
          modes: ['serve']
        },
      ],
      target: 'css'
    }
  ]
}
```

## Terminology
- Source.read(input)
- Target.write(output)

## CLI
```sh
proudce sourceDir targetDir # fs source and fs target
proudce sourceDir # fs source and http target
```
