<script setup>
import { computed, ref } from 'vue'

// An event's pictures as legacy's hcr_result.php showed them under its date:
// the first picture, its words and, for an item's picture, the way to its
// sheet; with more than one, their numbers, each showing its own picture and
// words when the pointer is on it (legacy's showImage()).

const props = defineProps({
  pictures: { type: Array, default: () => [] },
  seeLabel: { type: String, required: true },
})

const index = ref(0)
const shown = computed(() => props.pictures[index.value] ?? props.pictures[0] ?? null)
</script>

<template>
  <div v-if="shown" class="sharinghistory-tlp">
    <a class="sharinghistory-tlp__picture" :href="shown.image" target="_blank" rel="noopener"><img :src="shown.image" alt=""></a>
    <p class="sharinghistory-tlp__words">
      {{ shown.caption }}
      <RouterLink v-if="shown.to" class="sharinghistory-tlp__see" :to="shown.to">{{ seeLabel }}</RouterLink>
    </p>
    <p v-if="pictures.length > 1" class="sharinghistory-tlp__numbers">
      <a v-for="(picture, n) in pictures" :key="n" :href="picture.image" target="_blank" rel="noopener" @mouseover="index = n">{{ n + 1 }}</a>
    </p>
  </div>
</template>
