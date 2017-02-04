# produce - WIP

## Zeroconf
Install required plugins and it will automatically produce output

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
