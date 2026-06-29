# Pokemon Type Matchups DE

A fast German-first Pokemon type effectiveness checker. Search for a Pokemon, a German or English name, a German type word like `Stein`, `Feuer`, `Psycho`, or a close typo like `psychp`, and get the damage multipliers immediately.

Live site: https://pokedex-effektiv.vercel.app

## What It Does

- Search Pokemon by German or English name.
- Search types by German words and aliases, for example `stein`, `blitz`, `feuer`, `psycho`.
- Correct close typos in the search flow, for example `psychp` to `Psycho`.
- Show defensive effectiveness against a selected Pokemon: 4x, 2x, 1x, 0.5x, 0.25x and 0x.
- Show offensive effectiveness for a selected type.
- Show related Pokemon entries such as evolutions, shiny variants, Mega forms and Gigantamax forms.
- Provide direct pages for every Pokemon and type.

## Language

The interface is primarily German because the goal is quick lookup for German-speaking Pokemon players. The project metadata and documentation are English for public GitHub usage.

## Routes

```text
/pokemon/glurak
/pokemon/charizard
/typ/feuer
/typ/psycho
/type/fire
```

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- PokeAPI
- Vercel

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The production deployment runs on Vercel:

```text
https://pokedex-effektiv.vercel.app
```

## Topics

`pokemon`, `pokedex`, `type-effectiveness`, `type-matchups`, `german`, `deutsch`, `pokeapi`, `react`, `vite`, `shadcn-ui`, `vercel`

## License

MIT
