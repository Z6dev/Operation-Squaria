# Folder structure

- `src` - source code for the kaplay project/game
- `build` - for distribution, or host game in any provider I guess


## Development

```sh
$ npm run dev
```

will start a dev server at http://localhost:8000

## Distribution

```sh
$ npm run build
```

will build the js files into `dist/`, take notes that `dist/` is on gitignore

```sh
$ npm run zip
```

will build the game and package into a .zip file, you can upload to your server or itch.io / newground etc.