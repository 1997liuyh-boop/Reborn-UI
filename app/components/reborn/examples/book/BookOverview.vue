<script setup lang="ts">
/**
 * 总览卡片缩略：向左转开 30° 的立体书，露出书脊，封面上是图标、书名与一行简介
 *
 * 书本平时正对读者、悬停才转开；组件的 is-static 就是「固定为转开状态」，直接使用即可。
 * 最小尺寸 sm 宽 180px，整体缩放到 0.46 放进卡片；封面文字相应放大，缩放后仍可辨认。
 * 选用靛蓝配色：默认的 zinc 在暗色卡片底上几乎看不出轮廓。
 */
</script>

<template>
  <div class="relative h-[110px] w-[104px]">
    <div class="absolute top-0 left-[10px] origin-top-left scale-[0.46]">
      <Book
        is-static
        size="sm"
        color="indigo"
        shadow-size="sm"
      >
        <BookHeader>
          <Icon
            name="heroicons:book-open-solid"
            size="40"
          />
        </BookHeader>
        <BookTitle class="text-3xl">
          那本书
        </BookTitle>
        <BookDescription class="text-xl!">
          封面与书脊
        </BookDescription>
      </Book>
    </div>
  </div>
</template>
