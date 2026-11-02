import { computed } from 'vue'
import { useData } from './data.js'

// Legacy's Chronology (about_chronology_list.php, about_chronology_txt.php):
// the project's MWNF activities, which the inventory imports as the timeline
// of the project's root collection — the root activity's own fields in its
// `extra`, one event per activity in legacy's order, each with its English
// text, its other legacy columns in its translation's `extra`, and its
// pictures.

const { collections, timelineEvents, timelines, tr } = useData()

/** The project's chronology: the timeline of the collection with no parent. */
export const chronology = computed(() => {
  const root = (collections.value ?? []).find((c) => !c.parent_id)
  return root ? (timelines.value ?? []).find((t) => t.collection_id === root.id) ?? null : null
})

/** Its activities, in legacy's order. */
export const chronologyEvents = computed(() =>
  chronology.value
    ? (timelineEvents.value ?? [])
        .filter((event) => event.timeline_id === chronology.value.id)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : [],
)

/** An activity's words: its name and text, and its other columns. */
export function activityText(event) {
  const text = tr('timeline_events', event.id) ?? {}
  return { ...(text.extra ?? {}), name: text.name ?? '', description: text.description ?? '' }
}

/** Legacy's years: "2012", or "2012-2015" when it ran over several. */
export function activityYears(event) {
  return event.year_to && event.year_to !== event.year_from ? `${event.year_from}-${event.year_to}` : String(event.year_from ?? '')
}

/** Legacy's place: its cities, then its countries. */
export function activityPlace(text) {
  return [text.rea_cities, text.rea_countries].filter(Boolean).join(', ')
}

// Legacy wrote a date day first, its parts joined by "-" (12-12-2012).
const dayFirst = (date) => (date ? String(date).slice(0, 10).split('-').reverse().join('-') : '')

/**
 * Legacy's line under an activity's title: its place, then "from" its first
 * day "to" its last — in the words legacy wrote in English.
 */
export function activityWhereWhen(event, text, words) {
  const from = dayFirst(event.date_from) || String(event.year_from ?? '')
  const to = dayFirst(event.date_to) || String(event.year_to ?? '')
  const place = activityPlace(text)
  return `${place ? `${place}, ` : ''}${words.from} ${from}${to ? ` ${words.to} ${to}` : ''}`
}
