<template>
  <div class="articles-skeleton">
    <div v-for="i in count" :key="i" class="article-card skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-author-info">
          <div class="skeleton-line skeleton-author-name"></div>
          <div class="skeleton-line skeleton-author-time"></div>
        </div>
      </div>
      <div class="skeleton-title"></div>
      <div class="skeleton-summary">
        <div class="skeleton-line skeleton-summary-line1"></div>
        <div class="skeleton-line skeleton-summary-line2"></div>
        <div class="skeleton-line skeleton-summary-line3"></div>
      </div>
      <div class="skeleton-image"></div>
      <div class="skeleton-footer">
        <div class="skeleton-meta">
          <div class="skeleton-line skeleton-meta-item"></div>
          <div class="skeleton-line skeleton-meta-item"></div>
        </div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  count: {
    type: Number,
    default: 5
  }
})
</script>

<style scoped>
.articles-skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 2px 12px var(--shadow-light);
}

.skeleton-card {
  animation: none;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-author-info {
  flex: 1;
}

.skeleton-title {
  width: 80%;
  height: 24px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  animation: shimmer 1.5s infinite;
}

.skeleton-summary {
  margin-bottom: 16px;
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

.skeleton-author-name {
  width: 120px;
  height: 16px;
  margin-bottom: 4px;
}

.skeleton-author-time {
  width: 100px;
  height: 14px;
}

.skeleton-summary-line1 {
  width: 100%;
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-summary-line2 {
  width: 90%;
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-summary-line3 {
  width: 80%;
  height: 14px;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  margin-bottom: 16px;
  animation: shimmer 1.5s infinite;
}

.skeleton-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.skeleton-meta {
  display: flex;
  gap: 20px;
}

.skeleton-meta-item {
  width: 60px;
  height: 14px;
}

.skeleton-button {
  width: 80px;
  height: 32px;
  background: linear-gradient(
    90deg,
    var(--bg-hover) 25%,
    var(--border-light) 50%,
    var(--bg-hover) 75%
  );
  background-size: 200% 100%;
  border-radius: 20px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>