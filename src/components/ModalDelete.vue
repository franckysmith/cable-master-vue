<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <slot name="main"></slot>
      <div class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal-container {
  background: var(--bg, #fff);
  color: var(--text, #333);
  padding: 24px;
  border-radius: 12px;
  min-width: 280px;
  max-width: 350px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.modal-footer {
  margin-top: 15px;
  text-align: center;
}
</style>
