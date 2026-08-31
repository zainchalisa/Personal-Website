export const ABOUT_OVERVIEW_HEADLINE = "Hi, I'm Zain!"

export const ABOUT_OVERVIEW_SUBLINE = "I'm a software engineer based in NYC."

export const ABOUT_OVERVIEW_DETAIL_PARAGRAPHS = [
  "My interest for building things started when I broke my leg in first grade. While I was being homeschooled, my dad bought me an engineering set to keep me busy. That curiosity grew from building hardware projects to making viral YouTube and TikTok videos, and eventually to building software.",
  "Right now, I'm building consumer apps. I'm currently focused on shipping a product that helps people search and rediscover their memories the way they naturally think about them.",
  "When I'm not coding, I'm traveling, taking photos, or chasing whatever's next. Always happy to meet people building cool things so feel free to reach out :)",
] as const

export const ABOUT_OVERVIEW_PARAGRAPHS = [
  ABOUT_OVERVIEW_HEADLINE,
  ABOUT_OVERVIEW_SUBLINE,
  ...ABOUT_OVERVIEW_DETAIL_PARAGRAPHS,
] as const

export const ABOUT_OVERVIEW_BODY_MOBILE = [
  "I've always liked making things. After breaking my leg in first grade, my dad bought me an engineering set to keep me busy while I was being homeschooled. Since then, I've gone from hardware projects to viral YouTube and TikTok videos, and eventually to building software.",
  "Right now, I'm building consumer apps. I'm currently focused on shipping a product that helps people search and rediscover their memories the way they naturally think about them. Always happy to meet people building cool things so feel free to reach out :)",
] as const

/** Google/social snippet — About overview copy without the greeting headline. */
export const ABOUT_META_DESCRIPTION = ABOUT_OVERVIEW_PARAGRAPHS.slice(1).join(' ')
