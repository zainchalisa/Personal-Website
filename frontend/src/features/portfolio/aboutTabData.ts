import type { PortfolioClip } from './types'
import { timelineClipWidth } from './aboutTimelineUtils'
import { ABOUT_MOVIE_IMAGES, ABOUT_MUSIC_IMAGES, ABOUT_PLACE_IMAGES } from './aboutAssets'

export type MovieEntry = {
  id: string
  title: string
  year: number | string
  runtime: string
  director: string
  note: string
  noteLead: string
  noteRest: string
  mobileNote: string
  tags: string[]
  posterUrl: string
}

export type MusicEntry = {
  id: string
  title: string
  artist: string
  album: string
  note: string
  tags: string[]
  artworkUrl?: string
}

export type PlaceEntry = {
  id: string
  name: string
  city: string
  year: number
  note: string
  noteLead?: string
  imageUrl: string
}

export const MOVIE_ENTRIES: MovieEntry[] = [
  {
    id: 'la-la-land',
    title: 'La La Land',
    year: 2016,
    runtime: '128 min',
    director: 'Damien Chazelle',
    note: "I first watched this movie back in 2023, and since then I've watched it 4-5 times, finding new parts I love about it every time. I think this rom-com captures how realistic love can be in our current state of society. With people bound to chasing careers and paths made for them, love is a fickle thing. Even when two people are perfect for one another, it doesn't necessarily mean it will work out.",
    noteLead: 'Rewatched 4-5 times since 2023.',
    noteRest: "Captures how realistic love can be — even when two people are perfect for one another, it doesn't necessarily mean it will work out.",
    mobileNote:
      "I first watched this back in 2023 and have rewatched it 4-5 times since, catching something new every time. It captures how realistic love can be: even when two people are perfect for each other, that doesn't guarantee it works out.",
    tags: ['Romance', 'Musical', 'Rewatchable', 'Damien Chazelle'],
    posterUrl: ABOUT_MOVIE_IMAGES.laLaLand,
  },
  {
    id: 'taare-zameen-par',
    title: 'Taare Zameen Par',
    year: 2007,
    runtime: '165 min',
    director: 'Aamir Khan',
    note: "This movie was a childhood favorite of mine. Growing up in multiple different schools, I was surrounded by many friend group cultures, many of them toxic. Those groups never bred much creativity or inclusion. If you were different or \"under-performing,\" you were looked at less. Those are values I never picked up growing up, because of this movie. It genuinely reshaped how I saw people, since it's true: everyone has something they're special and talented in.",
    noteLead: 'A childhood favorite.',
    noteRest: "Reshaped how I saw people — everyone has something they're special and talented in.",
    mobileNote:
      "A childhood favorite. Growing up across multiple schools, I saw plenty of toxic friend group cultures where being different or \"under-performing\" got you looked down on. This movie reshaped how I saw people, since it's true: everyone has something they're special and talented in.",
    tags: ['Bollywood', 'Coming of age', 'Aamir Khan', 'Emotional'],
    posterUrl: ABOUT_MOVIE_IMAGES.taareZameenPar,
  },
  {
    id: 'harry-potter',
    title: 'Harry Potter Series',
    year: '2001–2011',
    runtime: '8 films',
    director: 'Various',
    note: 'This series is the most nostalgic piece of media I can talk about. Every Christmas without fail I watch the series, and it makes me feel like a kid again. The complexity of the characters, and seeing them grow up throughout the films, makes me feel as if I attended Hogwarts with them.',
    noteLead: 'My most nostalgic piece of media.',
    noteRest: 'Every Christmas without fail — feels like I attended Hogwarts with them.',
    mobileNote:
      'The most nostalgic piece of media I can talk about. I watch the series every Christmas without fail, and it still makes me feel like a kid again, growing up alongside the characters.',
    tags: ['Childhood', 'Fantasy', 'Rewatch every year', 'Series'],
    posterUrl: ABOUT_MOVIE_IMAGES.harryPotter,
  },
  {
    id: 'fruitvale-station',
    title: 'Fruitvale Station',
    year: 2013,
    runtime: '86 min',
    director: 'Ryan Coogler',
    note: "Fruitvale Station is a movie I watched most recently. The movie frames how unfair the world can be, especially when you're doing so much right. I shed some tears during this movie. I think media at the time dehumanized African Americans a lot, and I think this movie was a breath of fresh air, especially in how they really showed the main actor, Oscar, as a loving son and father.",
    noteLead: 'Watched most recently.',
    noteRest: 'Showed Oscar as a loving son and father — a breath of fresh air when media dehumanized African Americans.',
    mobileNote:
      'Watched this most recently, and it got me emotional. Media at the time dehumanized African Americans a lot, and this movie was a breath of fresh air in how it showed the main character, Oscar as a loving son and father.',
    tags: ['Based on true story', 'Ryan Coogler', 'Important', 'Drama'],
    posterUrl: ABOUT_MOVIE_IMAGES.fruitvaleStation,
  },
  {
    id: 'the-social-network',
    title: 'The Social Network',
    year: 2010,
    runtime: '120 min',
    director: 'David Fincher',
    note: "As a computer science major, I feel like The Social Network is the gateway I need to walk through before getting my degree. But in all honesty, this movie sparked a dream in my head back in 2022 which I haven't stopped thinking about since. I want to start a company, and I want to be extremely successful at doing so.",
    noteLead: 'The gateway before getting my CS degree.',
    noteRest: "Sparked a dream in 2022 I haven't stopped thinking about — I want to start a company and be extremely successful at it.",
    mobileNote:
      "As a CS major, this feels like a rite of passage. It sparked a dream back in 2022 I haven't let go of since: I want to start a company, and I want to be great at it.",
    tags: ['Startup', 'David Fincher', 'Rewatch every year', 'Formative'],
    posterUrl: ABOUT_MOVIE_IMAGES.socialNetwork,
  },
]

export const MUSIC_ENTRIES: MusicEntry[] = [
  {
    id: 'overdue',
    title: 'Overdue',
    artist: 'Travis Scott & Metro Boomin',
    album: 'Not All Heroes Wear Capes',
    note: "Overdue is a song I've been listening to non-stop since my senior year of high school. In everything I try in life, I feel like I'm constantly pushing myself, constantly trying to one-up my last win. Sometimes a lot of what I achieve feels overdue, and I entrap myself in working overtime just to see results. This song captures that feeling.",
    tags: ['Travis Scott', 'Late night', 'R&B'],
    artworkUrl: ABOUT_MUSIC_IMAGES.overdueAlbumCover,
  },
  {
    id: 'dear-april',
    title: 'Dear April',
    artist: 'Frank Ocean',
    album: 'Singles',
    note: "This is one of my favorite songs by Frank. It's really soothing to listen to, and I often find myself playing it while watching a sunset, or on Pier 25 looking up at the One World Trade building.",
    tags: ['Frank Ocean', 'Emotional', 'Short but perfect'],
    artworkUrl: ABOUT_MUSIC_IMAGES.dearAprilAlbumCover,
  },
  {
    id: 'dont-panic',
    title: "Don't Panic",
    artist: 'Coldplay',
    album: 'Parachutes',
    note: 'Coldplay is a really nostalgic band for me. I used to listen to them all the time in the car on road trips with my family. This is currently one of my favorite songs by them.',
    tags: ['Coldplay', 'Hopeful', 'Early 2000s'],
    artworkUrl: ABOUT_MUSIC_IMAGES.dontPanicAlbumCover,
  },
  {
    id: 'coldest-winter',
    title: 'Coldest Winter',
    artist: 'Kanye West',
    album: '808s & Heartbreak',
    note: 'One of my favorite songs, produced by Kanye.',
    tags: ['Kanye', '808s', 'Grief', 'Underrated'],
    artworkUrl: ABOUT_MUSIC_IMAGES.coldestWinterAlbumCover,
  },
  {
    id: 'all-i-need',
    title: 'All I Need',
    artist: 'Radiohead',
    album: 'In Rainbows',
    note: "I have to come clean, I'm a TikTok Radiohead fan. I found this song through a bunch of sad boy edits on TikTok and got hooked. So whenever I go through a sad time, or a really happy time after I've worked hard for something and achieved it, this is the first song I throw on.",
    tags: ['Radiohead', 'In rainbows', 'Ceiling starer'],
    artworkUrl: ABOUT_MUSIC_IMAGES.allINeedAlbumCover,
  },
]

export const PLACE_ENTRIES: PlaceEntry[] = [
  {
    id: 'english-countryside',
    name: 'English Countryside',
    city: 'England',
    year: 2023,
    note: 'I visited England for the first time with my family back in 2023. We stayed in London for a couple days, but as we drove out to places like Sussex and Windermere, you really got to see the beauty of the country: small cottages with sheep and horses. It was serene and peaceful. Definitely want to visit again sometime soon!',
    imageUrl: ABOUT_PLACE_IMAGES.englishCountryside,
  },
  {
    id: 'pier-25',
    name: 'Pier 25',
    city: 'Westside Highway, NYC',
    year: 2025,
    note: "This pier in NYC has been the site of some of the best conversations I've had in my life. From new friends to old friends, we've sat on the benches and talked for hours on end about our struggles and what we wanted to do with our lives. As someone who loves to listen, some of my favorite memories in the city live on this pier. (Plus there's a crazy good gelato spot nearby :))",
    imageUrl: ABOUT_PLACE_IMAGES.pierNyc,
  },
  {
    id: 'san-candido',
    name: 'San Candido',
    city: 'Italy',
    year: 2024,
    note: "My friends and I went on a month long trip after graduating college. The Dolomites was a bucket list spot of mine since I saw it on Instagram. When we got off the train, I couldn't stop saying \"OMG\" and yelling and calling every person I knew. Looking at the Alps for the first time was a surreal experience, and it's definitely one of my favorite places I've traveled to so far.",
    imageUrl: ABOUT_PLACE_IMAGES.dolomites,
  },
  {
    id: 'ocean-city-beach',
    name: 'Ocean City Beach',
    city: 'San Diego',
    year: 2025,
    note: "I went on a solo road trip from Portland, Oregon to San Diego, and my last stop was an Airbnb close to Ocean City Beach. There were four kids sitting on the rocks, laughing away while watching the sunset, and it made me feel extremely euphoric. At that point in life I was a little lost about where I wanted to go, and that moment made me realize I didn't need to have it all figured out.",
    imageUrl: ABOUT_PLACE_IMAGES.oceanCityBeach,
  },
  {
    id: 'innsbruck',
    name: 'Innsbruck',
    city: 'Austria',
    year: 2026,
    note: 'This was my second time in the Alps, but this time I was there with my sister. I was really happy to share the experience with her, and seeing her jaw drop while looking over the Alps at sunset was like reliving my grad trip all over again.',
    imageUrl: ABOUT_PLACE_IMAGES.innsbruck,
  },
]

function makeContentClip(
  id: string,
  name: string,
  stripe: string,
  secondaryLine = '',
): PortfolioClip {
  return {
    id,
    name,
    date: '—',
    dateRange: '—',
    year: '—',
    w: timelineClipWidth(name, secondaryLine),
    bg: '#141414',
    stripe,
    cat: 'ABOUT',
    catC: stripe,
    title: name,
    desc: '',
    tags: [],
    filter: 'all',
    v: 'default',
  }
}

export function buildMoviesTimelineClips(entries: MovieEntry[]): PortfolioClip[] {
  return entries.map((entry) => ({
    ...makeContentClip(entry.id, entry.title, '#e85d75', String(entry.year)),
    date: String(entry.year),
    year: String(entry.year),
  }))
}

function musicClipLabel(entry: MusicEntry) {
  return `${entry.title} — ${entry.artist}`
}

export function buildMusicTimelineClips(entries: MusicEntry[]): PortfolioClip[] {
  return entries.map((entry) => ({
    ...makeContentClip(entry.id, musicClipLabel(entry), '#7070cc', entry.artist),
    date: entry.artist,
  }))
}

export function buildPlacesTimelineClips(entries: PlaceEntry[]): PortfolioClip[] {
  return entries.map((entry) => ({
    ...makeContentClip(entry.id, entry.name, '#5cb85c', String(entry.year)),
    date: String(entry.year),
    year: String(entry.year),
  }))
}

export const MOVIES_TIMELINE_CLIPS: PortfolioClip[] = buildMoviesTimelineClips(MOVIE_ENTRIES)

export const MUSIC_TIMELINE_CLIPS: PortfolioClip[] = buildMusicTimelineClips(MUSIC_ENTRIES)

export const PLACES_TIMELINE_CLIPS: PortfolioClip[] = buildPlacesTimelineClips(PLACE_ENTRIES)
