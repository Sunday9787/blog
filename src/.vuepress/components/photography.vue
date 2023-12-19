<template>
  <ol class="photography">
    <li v-for="(item, k) in data" :key="k" class="photography-item">
      <picture>
        <img
          :src="item.photo"
          :alt="item.title"
          loading="lazy"
          class="photography-item-media" />
      </picture>

      <div class="photography-item-mask" />
      <div class="photography-item-title">{{ item.title }}</div>
      <div class="photography-item-place">
        <FontIcon :icon="item.icon || 'location-dot'" class="photography-icon" />
        <span>{{ item.place }}</span>
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
interface Photography {
  thumbnail: string;
  title: string;
  icon?: string;
  place: string;
  photo: string;
}

interface Props {
  column?: number;
  data: Photography[];
}

withDefaults(defineProps<Props>(), { column: 4 });
</script>

<style lang="scss">
.photography {
  position: relative;
  column-width: auto;
  column-gap: 5px;
  list-style: none;
  // column-count: 4;
  padding: 0;
}

.photography-item-media {
  display: block;
}

.photography-item {
  position: relative;
  margin-bottom: 5px;
  overflow: hidden;

  &:hover {
    .photography-item-media {
      transform: scale(1.05);
    }

    .photography-item-mask {
      background: rgba(0,0,0,.5);
    }

    .photography-item-title {
      transform: scale(1);
    }

    .photography-item-place {
      transform: scale(1);
    }
  }
}

.photography-item-media {
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: all .3s ease-in-out;
}

.photography-item-title {
  position: absolute;
  left: 15px;
  top: 15px;
  font-size: 14px;
  line-height: 20px;
  color: var(--white);
  transform: scale(0);
  transition: all 0.3s ease-in-out;
  z-index: 100;
}

.photography-item-place {
  position: absolute;
  left: 15px;
  bottom: 15px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  z-index: 100;
  transform: scale(0);
  transition: all 0.3s ease-in-out;
  color: var(--white);
}

.photography-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: 0 0;
  transition: all 0.3s ease-in-out;
  pointer-events: none;
  z-index: 10;
}

@media screen and (min-width: 350px) and (max-width: 680px) {
  .photography {
    column-count: 1;
  }
}

@media screen and (min-width: 681px) and (max-width: 997px) {
  .photography {
    column-count: 3;
  }
}

@media screen and (min-width: 998px) and (max-width: 1250px) {
  .photography {
    column-count: 3;
  }
}

@media screen and (min-width: 1250px) {
  .photography {
    column-count: 4;
  }
}
</style>
