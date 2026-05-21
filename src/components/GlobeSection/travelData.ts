export type TravelCountry = {
  label: string
  visited: boolean
  places: string[]
  totalPlaces: number
  visitedPlaces: number
}

export const TRAVEL_DATA: Record<string, TravelCountry> = {
  USA: {
    label: 'united states',
    visited: true,
    places: ['new york city', 'los angeles', 'miami', 'chicago'],
    totalPlaces: 50,
    visitedPlaces: 4,
  },
  JPN: {
    label: 'japan',
    visited: true,
    places: ['tokyo', 'kyoto', 'osaka'],
    totalPlaces: 47,
    visitedPlaces: 3,
  },
  FRA: {
    label: 'france',
    visited: true,
    places: ['paris', 'lyon'],
    totalPlaces: 18,
    visitedPlaces: 2,
  },
  GBR: {
    label: 'united kingdom',
    visited: true,
    places: ['london', 'manchester'],
    totalPlaces: 4,
    visitedPlaces: 2,
  },
  ITA: {
    label: 'italy',
    visited: true,
    places: ['rome', 'florence'],
    totalPlaces: 20,
    visitedPlaces: 2,
  },
  ESP: {
    label: 'spain',
    visited: true,
    places: ['barcelona', 'madrid'],
    totalPlaces: 17,
    visitedPlaces: 2,
  },
  DEU: {
    label: 'germany',
    visited: false,
    places: [],
    totalPlaces: 16,
    visitedPlaces: 0,
  },
  CAN: {
    label: 'canada',
    visited: false,
    places: [],
    totalPlaces: 13,
    visitedPlaces: 0,
  },
}

export const UN_RECOGNIZED_COUNTRIES = 195
