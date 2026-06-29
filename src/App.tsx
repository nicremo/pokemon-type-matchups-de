import { useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  BadgeInfoIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  SwordsIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy"

type PokemonNameEntry = {
  id: number
  name: string
  normalized: string
  language: "de" | "en"
}

type Suggestion =
  | {
      kind: "type"
      value: PokemonType
      label: string
      helper: string
      score: number
    }
  | {
      kind: "pokemon"
      value: number
      label: string
      helper: string
      score: number
    }

type ApiPokemon = {
  id: number
  name: string
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      "official-artwork"?: {
        front_default: string | null
        front_shiny: string | null
      }
    }
  }
  species: {
    name: string
    url: string
  }
  types: Array<{
    slot: number
    type: {
      name: PokemonType
    }
  }>
}

type ApiSpecies = {
  id: number
  name: string
  names: Array<{
    name: string
    language: {
      name: string
    }
  }>
  evolution_chain: {
    url: string
  }
  varieties: Array<{
    is_default: boolean
    pokemon: {
      name: string
      url: string
    }
  }>
}

type EvolutionNode = {
  species: {
    name: string
    url: string
  }
  evolves_to: EvolutionNode[]
}

type EvolutionChain = {
  chain: EvolutionNode
}

type RelatedItem = {
  key: string
  label: string
  helper: string
  kind: "Entwicklung" | "Form" | "Shiny"
  image: string | null
  actionName?: string
}

type PokemonResult = {
  mode: "pokemon"
  pokemon: ApiPokemon
  species: ApiSpecies
  displayName: string
  englishName: string
  related: RelatedItem[]
  rows: EffectivenessRow[]
}

type TypeResult = {
  mode: "type"
  attackType: PokemonType
  rows: EffectivenessRow[]
}

type AppResult = PokemonResult | TypeResult

type EffectivenessRow = {
  type: PokemonType
  multiplier: number
  label: string
  description: string
}

type RouteTarget =
  | { kind: "home" }
  | { kind: "pokemon"; value: string }
  | { kind: "type"; value: PokemonType }

type SearchOptions = {
  push?: boolean
}

const TYPE_ORDER: PokemonType[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]

const TYPE_META: Record<
  PokemonType,
  { label: string; aliases: string[]; color: string; foreground: string }
> = {
  normal: {
    label: "Normal",
    aliases: ["normal"],
    color: "oklch(0.66 0.02 100)",
    foreground: "oklch(0.18 0.02 100)",
  },
  fire: {
    label: "Feuer",
    aliases: ["feuer", "fire"],
    color: "oklch(0.67 0.2 35)",
    foreground: "oklch(0.99 0.01 35)",
  },
  water: {
    label: "Wasser",
    aliases: ["wasser", "water"],
    color: "oklch(0.58 0.17 250)",
    foreground: "oklch(0.99 0.01 250)",
  },
  electric: {
    label: "Elektro",
    aliases: ["elektro", "electric", "blitz", "strom", "donner"],
    color: "oklch(0.82 0.17 88)",
    foreground: "oklch(0.18 0.04 88)",
  },
  grass: {
    label: "Pflanze",
    aliases: ["pflanze", "grass", "blatt", "gras"],
    color: "oklch(0.58 0.17 145)",
    foreground: "oklch(0.99 0.01 145)",
  },
  ice: {
    label: "Eis",
    aliases: ["eis", "ice"],
    color: "oklch(0.78 0.11 205)",
    foreground: "oklch(0.17 0.03 205)",
  },
  fighting: {
    label: "Kampf",
    aliases: ["kampf", "fighting"],
    color: "oklch(0.51 0.19 25)",
    foreground: "oklch(0.99 0.01 25)",
  },
  poison: {
    label: "Gift",
    aliases: ["gift", "poison"],
    color: "oklch(0.55 0.17 320)",
    foreground: "oklch(0.99 0.01 320)",
  },
  ground: {
    label: "Boden",
    aliases: ["boden", "ground", "erde"],
    color: "oklch(0.64 0.11 78)",
    foreground: "oklch(0.18 0.03 78)",
  },
  flying: {
    label: "Flug",
    aliases: ["flug", "flying", "luft"],
    color: "oklch(0.65 0.13 265)",
    foreground: "oklch(0.99 0.01 265)",
  },
  psychic: {
    label: "Psycho",
    aliases: ["psycho", "psychic", "psi"],
    color: "oklch(0.64 0.2 350)",
    foreground: "oklch(0.99 0.01 350)",
  },
  bug: {
    label: "Käfer",
    aliases: ["käfer", "kaefer", "bug", "insekt"],
    color: "oklch(0.61 0.16 125)",
    foreground: "oklch(0.99 0.01 125)",
  },
  rock: {
    label: "Gestein",
    aliases: ["gestein", "stein", "rock", "fels"],
    color: "oklch(0.57 0.1 82)",
    foreground: "oklch(0.99 0.01 82)",
  },
  ghost: {
    label: "Geist",
    aliases: ["geist", "ghost"],
    color: "oklch(0.45 0.14 292)",
    foreground: "oklch(0.99 0.01 292)",
  },
  dragon: {
    label: "Drache",
    aliases: ["drache", "dragon"],
    color: "oklch(0.47 0.18 278)",
    foreground: "oklch(0.99 0.01 278)",
  },
  dark: {
    label: "Unlicht",
    aliases: ["unlicht", "dark", "dunkel"],
    color: "oklch(0.34 0.04 50)",
    foreground: "oklch(0.99 0.01 50)",
  },
  steel: {
    label: "Stahl",
    aliases: ["stahl", "steel", "metall"],
    color: "oklch(0.62 0.04 250)",
    foreground: "oklch(0.17 0.02 250)",
  },
  fairy: {
    label: "Fee",
    aliases: ["fee", "fairy", "zauber"],
    color: "oklch(0.74 0.13 337)",
    foreground: "oklch(0.18 0.03 337)",
  },
}

const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
}

const SAMPLE_SEARCHES = ["Glurak", "Psycho", "stein", "psychp", "blitz"]

const MULTIPLIER_COPY: Record<number, { label: string; description: string }> =
  {
    4: { label: "4x", description: "extrem stark" },
    2: { label: "2x", description: "sehr effektiv" },
    1: { label: "1x", description: "neutral" },
    0.5: { label: "0.5x", description: "wenig effektiv" },
    0.25: { label: "0.25x", description: "sehr schwach" },
    0: { label: "0x", description: "keine Wirkung" },
  }

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "")
}

function toPageSlug(value: string) {
  return normalize(value)
}

function pokemonPath(result: PokemonResult) {
  return `/pokemon/${toPageSlug(result.displayName)}`
}

function typePath(type: PokemonType) {
  return `/typ/${toPageSlug(TYPE_META[type].label)}`
}

function parseRoute(pathname: string): RouteTarget {
  const [, section, rawValue] = pathname.split("/")
  const decoded = decodeURIComponent(rawValue ?? "")

  if ((section === "typ" || section === "type") && decoded) {
    const type = getTypeFromInput(decoded)
    return type ? { kind: "type", value: type } : { kind: "home" }
  }

  if (section === "pokemon" && decoded) {
    return { kind: "pokemon", value: decoded }
  }

  return { kind: "home" }
}

function writePagePath(path: string, replace = false) {
  if (window.location.pathname === path) return
  const method = replace ? "replaceState" : "pushState"
  window.history[method](null, "", path)
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getPokemonIdFromUrl(url: string) {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

function getPokemonIdFromPokemonUrl(url: string) {
  return getPokemonIdFromUrl(url)
}

function getSprite(pokemon: ApiPokemon, shiny = false) {
  const artwork = pokemon.sprites.other?.["official-artwork"]
  return shiny
    ? artwork?.front_shiny ?? pokemon.sprites.front_shiny ?? artwork?.front_default ?? pokemon.sprites.front_default
    : artwork?.front_default ?? pokemon.sprites.front_default
}

function getSpeciesDisplayName(species: ApiSpecies) {
  return (
    species.names.find((name) => name.language.name === "de")?.name ??
    species.names.find((name) => name.language.name === "en")?.name ??
    titleCase(species.name)
  )
}

function getSpeciesEnglishName(species: ApiSpecies) {
  return (
    species.names.find((name) => name.language.name === "en")?.name ??
    titleCase(species.name)
  )
}

function formatPokemonName(name: string, speciesName?: string) {
  const cleaned = name.replace(`${speciesName ?? ""}-`, "")
  return titleCase(cleaned)
    .replace(/\bGmax\b/g, "Gigadynamax")
    .replace(/\bMega\b/g, "Mega")
}

function attackMultiplier(attack: PokemonType, defenderTypes: PokemonType[]) {
  return defenderTypes.reduce((total, defender) => {
    return total * (TYPE_CHART[attack][defender] ?? 1)
  }, 1)
}

function makeRowsForDefender(defenderTypes: PokemonType[]): EffectivenessRow[] {
  return TYPE_ORDER.map((type) => {
    const multiplier = attackMultiplier(type, defenderTypes)
    const copy = MULTIPLIER_COPY[multiplier]
    return {
      type,
      multiplier,
      label: copy.label,
      description: copy.description,
    }
  }).sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type))
}

function makeRowsForAttackType(attackType: PokemonType): EffectivenessRow[] {
  return TYPE_ORDER.map((type) => {
    const multiplier = TYPE_CHART[attackType][type] ?? 1
    const copy = MULTIPLIER_COPY[multiplier]
    return {
      type,
      multiplier,
      label: copy.label,
      description: copy.description,
    }
  }).sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type))
}

function groupRows(rows: EffectivenessRow[]) {
  return [4, 2, 1, 0.5, 0.25, 0].map((value) => ({
    multiplier: value,
    rows: rows.filter((row) => row.multiplier === value),
  }))
}

function editDistance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function scoreText(query: string, candidate: string) {
  if (!query) return 999
  if (candidate === query) return 0
  if (candidate.startsWith(query)) return 1 + candidate.length / 100
  if (candidate.includes(query)) return 2 + candidate.indexOf(query) / 100
  return 4 + editDistance(query, candidate) / Math.max(candidate.length, query.length)
}

function scoreTypeAlias(query: string, candidate: string) {
  if (!query) return Number.POSITIVE_INFINITY
  if (candidate === query) return 0
  if (candidate.startsWith(query)) return 1 + candidate.length / 100
  if (query.length >= 3 && candidate.includes(query)) {
    return 2 + candidate.indexOf(query) / 100
  }

  const distance = editDistance(query, candidate)
  const allowedDistance = query.length >= 6 ? 2 : query.length >= 4 ? 1 : 0
  if (distance <= allowedDistance) {
    return 3 + distance / 10
  }

  return Number.POSITIVE_INFINITY
}

function getTypeFromInput(input: string) {
  const normalized = normalize(input)
  if (!normalized) return null

  let best: { type: PokemonType; score: number } | null = null

  for (const type of TYPE_ORDER) {
    const meta = TYPE_META[type]
    const candidates = [meta.label, type, ...meta.aliases].map(normalize)
    const score = Math.min(...candidates.map((candidate) => scoreTypeAlias(normalized, candidate)))
    if (!best || score < best.score) {
      best = { type, score }
    }
  }

  if (!best) return null
  return Number.isFinite(best.score) ? best.type : null
}

function makeSuggestions(input: string, names: PokemonNameEntry[]): Suggestion[] {
  const normalized = normalize(input)
  if (!normalized) return []

  const typeSuggestions = TYPE_ORDER.map((type) => {
    const meta = TYPE_META[type]
    const candidates = [meta.label, type, ...meta.aliases].map(normalize)
    const score = Math.min(...candidates.map((candidate) => scoreTypeAlias(normalized, candidate)))
    return {
      kind: "type" as const,
      value: type,
      label: meta.label,
      helper: `Typ ${type}`,
      score,
    }
  })

  const deduped = new Map<
    number,
    {
      id: number
      label: string
      helper: string
      score: number
    }
  >()

  for (const entry of names) {
    const score = scoreText(normalized, entry.normalized)
    const helper = entry.language === "de" ? "Pokémon" : "Pokemon"
    const current = deduped.get(entry.id)

    if (!current || score < current.score) {
      deduped.set(entry.id, {
        id: entry.id,
        label: entry.name,
        helper,
        score,
      })
    }
  }

  const pokemonSuggestions = [...deduped.values()]
    .map((entry) => ({
      kind: "pokemon" as const,
      value: entry.id,
      label: entry.label,
      helper: entry.helper,
      score: entry.score,
    }))
    .filter((entry) => entry.score <= 4.5)

  return [...typeSuggestions, ...pokemonSuggestions]
    .filter((entry) => Number.isFinite(entry.score) && entry.score <= 4.5)
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, "de"))
    .slice(0, 9)
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

function toApiSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
}

async function fetchNameIndex() {
  const response = await fetch("https://beta.pokeapi.co/graphql/v1beta", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query NameIndex {
          pokemon_v2_pokemonspeciesname(where: { language_id: { _in: [6, 9] } }) {
            name
            pokemon_species_id
            language_id
          }
        }
      `,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as {
    data?: {
      pokemon_v2_pokemonspeciesname: Array<{
        name: string
        pokemon_species_id: number
        language_id: number
      }>
    }
  }

  return (
    payload.data?.pokemon_v2_pokemonspeciesname.map((entry) => ({
      id: entry.pokemon_species_id,
      name: entry.name,
      normalized: normalize(entry.name),
      language: entry.language_id === 6 ? ("de" as const) : ("en" as const),
    })) ?? []
  )
}

async function fetchPokemon(input: string | number) {
  const slug = typeof input === "number" ? String(input) : toApiSlug(input)
  return fetchJson<ApiPokemon>(`https://pokeapi.co/api/v2/pokemon/${slug}`)
}

async function fetchSpecies(input: string | number) {
  const slug = typeof input === "number" ? String(input) : toApiSlug(input)
  return fetchJson<ApiSpecies>(`https://pokeapi.co/api/v2/pokemon-species/${slug}`)
}

async function fetchPokemonBySpeciesId(id: number) {
  const species = await fetchSpecies(id)
  const defaultVariety = species.varieties.find((variety) => variety.is_default)
  const pokemon = await fetchPokemon(defaultVariety?.pokemon.name ?? species.name)
  return { pokemon, species }
}

function collectEvolutionSpecies(node: EvolutionNode, output: Array<{ name: string; id: number }>) {
  const id = getPokemonIdFromUrl(node.species.url)
  if (id) {
    output.push({ name: node.species.name, id })
  }
  for (const child of node.evolves_to) {
    collectEvolutionSpecies(child, output)
  }
}

async function getRelatedItems(pokemon: ApiPokemon, species: ApiSpecies) {
  const related: RelatedItem[] = []
  const seen = new Set<string>()
  const currentSpeciesId = species.id

  for (const variety of species.varieties) {
    const pokemonId = getPokemonIdFromPokemonUrl(variety.pokemon.url)
    const varietyPokemon =
      variety.pokemon.name === pokemon.name ? pokemon : await fetchPokemon(variety.pokemon.name)
    const display = formatPokemonName(variety.pokemon.name, species.name)
    const defaultImage = getSprite(varietyPokemon)
    const shinyImage = getSprite(varietyPokemon, true)

    if (variety.pokemon.name !== pokemon.name && !seen.has(variety.pokemon.name)) {
      seen.add(variety.pokemon.name)
      related.push({
        key: variety.pokemon.name,
        label: display,
        helper: variety.is_default ? "Standardform" : "Alternative Form",
        kind: "Form",
        image: defaultImage,
        actionName: variety.pokemon.name,
      })
    }

    const shinyKey = `${variety.pokemon.name}-shiny`
    if (shinyImage && !seen.has(shinyKey)) {
      seen.add(shinyKey)
      related.push({
        key: shinyKey,
        label: `Shiny ${display}`,
        helper: pokemonId ? `Pokémon ID ${pokemonId}` : "Shiny Variante",
        kind: "Shiny",
        image: shinyImage,
        actionName: variety.pokemon.name,
      })
    }
  }

  const chain = await fetchJson<EvolutionChain>(species.evolution_chain.url)
  const evolutionSpecies: Array<{ name: string; id: number }> = []
  collectEvolutionSpecies(chain.chain, evolutionSpecies)

  for (const item of evolutionSpecies) {
    if (item.id === currentSpeciesId) continue
    const evoSpecies = await fetchSpecies(item.id)
    const defaultVariety = evoSpecies.varieties.find((variety) => variety.is_default)
    const evoPokemon = defaultVariety ? await fetchPokemon(defaultVariety.pokemon.name) : null
    related.push({
      key: `evolution-${item.id}`,
      label: getSpeciesDisplayName(evoSpecies),
      helper: "Entwicklungslinie",
      kind: "Entwicklung",
      image: evoPokemon ? getSprite(evoPokemon) : null,
      actionName: defaultVariety?.pokemon.name ?? item.name,
    })
  }

  return related
}

async function resolvePokemon(input: string | number, names: PokemonNameEntry[]) {
  const normalized = typeof input === "number" ? "" : normalize(input)
  const nameMatch =
    typeof input === "number"
      ? null
      : names.find((entry) => entry.normalized === normalized) ??
        names
          .map((entry) => ({
            entry,
            score: scoreText(normalized, entry.normalized),
          }))
          .sort((a, b) => a.score - b.score)[0]?.entry

  const { pokemon, species } =
    typeof input === "number"
      ? await fetchPokemonBySpeciesId(input)
      : nameMatch
        ? await fetchPokemonBySpeciesId(nameMatch.id)
        : { pokemon: await fetchPokemon(input), species: await fetchSpecies(input) }

  const defenderTypes = pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type.name)

  return {
    mode: "pokemon" as const,
    pokemon,
    species,
    displayName: getSpeciesDisplayName(species),
    englishName: getSpeciesEnglishName(species),
    related: await getRelatedItems(pokemon, species),
    rows: makeRowsForDefender(defenderTypes),
  }
}

function TypeBadge({ type, subtle = false }: { type: PokemonType; subtle?: boolean }) {
  const meta = TYPE_META[type]

  return (
    <Badge
      variant={subtle ? "secondary" : "outline"}
      className="rounded-md border-transparent font-medium"
      style={
        subtle
          ? undefined
          : {
              backgroundColor: meta.color,
              color: meta.foreground,
            }
      }
    >
      {meta.label}
    </Badge>
  )
}

function MultiplierBadge({ value }: { value: number }) {
  const variant = value >= 2 ? "default" : value === 0 ? "destructive" : value < 1 ? "secondary" : "outline"
  return <Badge variant={variant}>{MULTIPLIER_COPY[value].label}</Badge>
}

function SuggestionIcon({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.kind === "type") {
    return (
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md border"
        style={{
          backgroundColor: TYPE_META[suggestion.value].color,
          color: TYPE_META[suggestion.value].foreground,
        }}
      >
        <ZapIcon />
      </span>
    )
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-foreground">
      <SearchIcon />
    </span>
  )
}

function EffectivenessTable({ rows }: { rows: EffectivenessRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Multiplikator</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead className="hidden sm:table-cell">Einordnung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.type}-${row.multiplier}`}>
            <TableCell className="w-32">
              <MultiplierBadge value={row.multiplier} />
            </TableCell>
            <TableCell>
              <TypeBadge type={row.type} />
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {row.description}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GroupedEffectiveness({ rows }: { rows: EffectivenessRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groupRows(rows).map((group) => (
        <Card key={group.multiplier} size="sm" className="min-h-40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MultiplierBadge value={group.multiplier} />
              {MULTIPLIER_COPY[group.multiplier].description}
            </CardTitle>
            <CardDescription>{group.rows.length} Typen</CardDescription>
          </CardHeader>
          <CardContent>
            {group.rows.length ? (
              <div className="flex flex-wrap gap-2">
                {group.rows.map((row) => (
                  <TypeBadge key={row.type} type={row.type} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Treffer in dieser Gruppe.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-9 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function RelatedGrid({
  items,
  onSelect,
}: {
  items: RelatedItem[]
  onSelect: (item: RelatedItem) => void
}) {
  if (!items.length) {
    return (
      <Empty className="min-h-48 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BadgeInfoIcon />
          </EmptyMedia>
          <EmptyTitle>Keine weiteren Formen gefunden</EmptyTitle>
          <EmptyDescription>
            PokeAPI meldet für dieses Pokémon keine weiteren Varianten.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="group flex min-h-28 items-center gap-4 rounded-xl border bg-card p-4 text-left text-card-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => onSelect(item)}
        >
          <Avatar className="size-14 rounded-lg border bg-background">
            <AvatarImage src={item.image ?? undefined} alt="" />
            <AvatarFallback>{item.label.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 gap-1">
            <span className="truncate text-sm font-medium">{item.label}</span>
            <span className="flex flex-wrap gap-1">
              <Badge variant="secondary">{item.kind}</Badge>
              <span className="text-xs text-muted-foreground">{item.helper}</span>
            </span>
          </span>
          <ArrowUpRightIcon className="ml-auto opacity-0 transition group-hover:opacity-100" />
        </button>
      ))}
    </div>
  )
}

function PokemonHero({
  result,
  onRelatedSelect,
}: {
  result: PokemonResult
  onRelatedSelect: (item: RelatedItem) => void
}) {
  const types = result.pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => entry.type.name)
  const sprite = getSprite(result.pokemon)
  const strongCount = result.rows.filter((row) => row.multiplier >= 2).length
  const immuneCount = result.rows.filter((row) => row.multiplier === 0).length

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-16 rounded-xl border bg-muted">
                <AvatarImage src={sprite ?? undefined} alt="" />
                <AvatarFallback>{result.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle className="text-xl">{result.displayName}</CardTitle>
                <CardDescription>
                  {result.englishName} · #{result.pokemon.id}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  {types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <BadgeInfoIcon data-icon="inline-start" />
                  Details
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>{result.displayName}</SheetTitle>
                  <SheetDescription>
                    Typen, Multiplikatoren und weitere Formen kompakt geprüft.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
                  <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      {types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </div>
                    <Separator />
                    <GroupedEffectiveness rows={result.rows} />
                    <Separator />
                    <RelatedGrid items={result.related} onSelect={onRelatedSelect} />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gruppen" className="gap-4">
            <TabsList>
              <TabsTrigger value="gruppen">
                <ShieldIcon data-icon="inline-start" />
                Gruppen
              </TabsTrigger>
              <TabsTrigger value="tabelle">
                <SwordsIcon data-icon="inline-start" />
                Tabelle
              </TabsTrigger>
              <TabsTrigger value="weitere">
                <SparklesIcon data-icon="inline-start" />
                Weitere
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gruppen" className="pt-4">
              <GroupedEffectiveness rows={result.rows} />
            </TabsContent>
            <TabsContent value="tabelle" className="pt-4">
              <EffectivenessTable rows={result.rows} />
            </TabsContent>
            <TabsContent value="weitere" className="pt-4">
              <RelatedGrid items={result.related} onSelect={onRelatedSelect} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {strongCount} starke Angriffs-Typen, {immuneCount} Immunitäten.
          </span>
          <Button variant="ghost" size="sm" asChild>
            <a href={`https://pokeapi.co/api/v2/pokemon/${result.pokemon.id}`} target="_blank" rel="noreferrer">
              API
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direkte Antwort</CardTitle>
          <CardDescription>Beste Angriffs-Typen gegen dieses Pokémon.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[4, 2, 0].map((value) => {
            const rows = result.rows.filter((row) => row.multiplier === value)
            return (
              <div key={value} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <MultiplierBadge value={value} />
                  <span className="text-xs text-muted-foreground">{rows.length} Treffer</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rows.length ? (
                    rows.map((row) => <TypeBadge key={row.type} type={row.type} />)
                  ) : (
                    <span className="text-sm text-muted-foreground">Keine.</span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function TypeHero({ result }: { result: TypeResult }) {
  const meta = TYPE_META[result.attackType]
  const superEffective = result.rows.filter((row) => row.multiplier === 2)
  const noEffect = result.rows.filter((row) => row.multiplier === 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TypeBadge type={result.attackType} />
            als Angriff
          </CardTitle>
          <CardDescription>
            So wirkt {meta.label} gegen jeden verteidigenden Einzeltyp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gruppen" className="gap-4">
            <TabsList>
              <TabsTrigger value="gruppen">Gruppen</TabsTrigger>
              <TabsTrigger value="tabelle">Tabelle</TabsTrigger>
            </TabsList>
            <TabsContent value="gruppen" className="pt-4">
              <GroupedEffectiveness rows={result.rows} />
            </TabsContent>
            <TabsContent value="tabelle" className="pt-4">
              <EffectivenessTable rows={result.rows} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Kurzfassung</CardTitle>
          <CardDescription>{meta.label} im Typenvergleich.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <MultiplierBadge value={2} />
            <div className="flex flex-wrap gap-2">
              {superEffective.map((row) => (
                <TypeBadge key={row.type} type={row.type} />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <MultiplierBadge value={0} />
            <div className="flex flex-wrap gap-2">
              {noEffect.length ? (
                noEffect.map((row) => <TypeBadge key={row.type} type={row.type} />)
              ) : (
                <span className="text-sm text-muted-foreground">Keine Immunität.</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState("Glurak")
  const [names, setNames] = useState<PokemonNameEntry[]>([])
  const [namesLoading, setNamesLoading] = useState(true)
  const [result, setResult] = useState<AppResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRelated, setSelectedRelated] = useState<RelatedItem | null>(null)

  const suggestions = useMemo(() => makeSuggestions(query, names), [query, names])

  function commitResult(nextResult: AppResult, nextQuery: string, options: SearchOptions = {}) {
    setResult(nextResult)
    setQuery(nextQuery)
    setError(null)

    if (nextResult.mode === "pokemon") {
      document.title = `${nextResult.displayName} Effektivität`
      if (options.push !== false) {
        writePagePath(pokemonPath(nextResult))
      }
      return
    }

    document.title = `${TYPE_META[nextResult.attackType].label} Effektivität`
    if (options.push !== false) {
      writePagePath(typePath(nextResult.attackType))
    }
  }

  async function loadRoute(route: RouteTarget, options: SearchOptions = {}) {
    if (route.kind === "type") {
      commitResult(
        {
          mode: "type",
          attackType: route.value,
          rows: makeRowsForAttackType(route.value),
        },
        TYPE_META[route.value].label,
        options,
      )
      return
    }

    if (route.kind === "pokemon") {
      await runSearch(route.value, undefined, options)
      return
    }

    await runSearch("Glurak", undefined, options)
  }

  useEffect(() => {
    let active = true
    fetchNameIndex()
      .then((entries) => {
        if (!active) return
        setNames(entries)
      })
      .catch(() => {
        toast.error("Namensindex konnte nicht geladen werden.")
      })
      .finally(() => {
        if (active) {
          setNamesLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!namesLoading && names.length && !result) {
      void loadRoute(parseRoute(window.location.pathname), { push: false })
    }
  }, [namesLoading, names, result])

  useEffect(() => {
    function handlePopState() {
      void loadRoute(parseRoute(window.location.pathname), { push: false })
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  })

  async function runSearch(nextValue = query, suggestion?: Suggestion, options: SearchOptions = {}) {
    const trimmed = nextValue.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    const localSuggestions = makeSuggestions(trimmed, names)

    try {
      if (suggestion?.kind === "type") {
        commitResult({
          mode: "type",
          attackType: suggestion.value,
          rows: makeRowsForAttackType(suggestion.value),
        }, TYPE_META[suggestion.value].label, options)
        return
      }

      if (suggestion?.kind === "pokemon") {
        const pokemonResult = await resolvePokemon(suggestion.value, names)
        commitResult(pokemonResult, pokemonResult.displayName, options)
        return
      }

      const type = getTypeFromInput(trimmed)
      const exactPokemon = names.find((entry) => entry.normalized === normalize(trimmed))
      const firstSuggestion = localSuggestions[0]

      if (type && (!firstSuggestion || firstSuggestion.kind === "type")) {
        commitResult({
          mode: "type",
          attackType: type,
          rows: makeRowsForAttackType(type),
        }, TYPE_META[type].label, options)
        return
      }

      if (exactPokemon) {
        const pokemonResult = await resolvePokemon(exactPokemon.id, names)
        commitResult(pokemonResult, pokemonResult.displayName, options)
        return
      }

      if (firstSuggestion && normalize(trimmed) !== normalize(firstSuggestion.label)) {
        if (firstSuggestion.kind === "type") {
          commitResult({
            mode: "type",
            attackType: firstSuggestion.value,
            rows: makeRowsForAttackType(firstSuggestion.value),
          }, TYPE_META[firstSuggestion.value].label, options)
          return
        }

        const pokemonResult = await resolvePokemon(firstSuggestion.value, names)
        commitResult(pokemonResult, pokemonResult.displayName, options)
        return
      }

      const pokemonResult = await resolvePokemon(trimmed, names)
      commitResult(pokemonResult, pokemonResult.displayName, options)
    } catch {
      setError("Ich konnte dazu kein Pokémon oder keinen Typ finden.")
      toast.error("Keine passende Suche gefunden.")
    } finally {
      setLoading(false)
    }
  }

  async function runRelated(item: RelatedItem) {
    if (!item.actionName) return
    setSelectedRelated(null)
    setQuery(item.label.replace(/^Shiny\s+/i, ""))
    await runSearch(item.actionName)
  }

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border bg-primary text-primary-foreground">
                <SwordsIcon />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Pokemon Type Matchups</h1>
                <p className="text-sm text-muted-foreground">
                  Primär Deutsch, mit englischen Namen, Typ-Alias, Tippfehlern und Formen.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2Icon />
                    shadcn/ui
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Echte shadcn Komponenten, lokal im Projekt.</TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.pkmn.help/offense/single/" target="_blank" rel="noreferrer">
                  Referenz
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </header>

          <main className="grid gap-8">
            <Card className="search-card">
              <CardHeader>
                <CardTitle className="text-lg">Direkte Suche</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="pokemon-search" className="sr-only">Suche</FieldLabel>
                    </FieldContent>
                    <Command
                      shouldFilter={false}
                      className="search-command rounded-xl border bg-background"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          void runSearch(query, suggestions[0])
                        }
                      }}
                    >
                      <CommandInput
                        id="pokemon-search"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Glurak, Charizard, Feuer, psychp..."
                      />
                      <CommandList>
                        <CommandEmpty>Kein Vorschlag gefunden.</CommandEmpty>
                        <CommandGroup>
                          {suggestions.map((suggestion) => (
                            <CommandItem
                              className="suggestion-row"
                              key={`${suggestion.kind}-${suggestion.value}`}
                              value={`${suggestion.kind}-${suggestion.label}`}
                              onSelect={() => void runSearch(suggestion.label, suggestion)}
                            >
                              <SuggestionIcon suggestion={suggestion} />
                              <span className="grid min-w-0 flex-1 gap-0.5">
                                <span className="truncate font-medium">{suggestion.label}</span>
                              </span>
                              <Badge variant="secondary">{suggestion.helper}</Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="justify-end">
                <Button disabled={loading} onClick={() => void runSearch(query, suggestions[0])}>
                  {loading ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <SearchIcon data-icon="inline-start" />}
                  Prüfen
                </Button>
              </CardFooter>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Suche fehlgeschlagen</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <BadgeInfoIcon />
              <AlertTitle>Datenquelle</AlertTitle>
              <AlertDescription>
                Typenlogik ist lokal hinterlegt, Pokémon-Daten und Formen kommen live aus PokeAPI.
              </AlertDescription>
            </Alert>

            {namesLoading && !result ? <SearchSkeleton /> : null}
            {loading ? (
              <ResultSkeleton />
            ) : result?.mode === "pokemon" ? (
              <PokemonHero result={result} onRelatedSelect={setSelectedRelated} />
            ) : result?.mode === "type" ? (
              <TypeHero result={result} />
            ) : (
              <Card>
                <CardContent>
                  <Empty className="min-h-64">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchIcon />
                      </EmptyMedia>
                      <EmptyTitle>Starte mit einer Suche</EmptyTitle>
                      <EmptyDescription>
                        Gib ein Pokémon oder einen Typ ein, um die Effektivität zu sehen.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <SearchIcon />
                        </InputGroupAddon>
                      </InputGroup>
                    </EmptyContent>
                  </Empty>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      <Dialog open={!!selectedRelated} onOpenChange={(open) => !open && setSelectedRelated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRelated?.label}</DialogTitle>
            <DialogDescription>{selectedRelated?.helper}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-24 rounded-xl border bg-muted">
              <AvatarImage src={selectedRelated?.image ?? undefined} alt="" />
              <AvatarFallback>{selectedRelated?.label.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid gap-3">
              <Badge variant="secondary">{selectedRelated?.kind}</Badge>
              <Button onClick={() => selectedRelated && void runRelated(selectedRelated)}>
                Öffnen
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </TooltipProvider>
  )
}
