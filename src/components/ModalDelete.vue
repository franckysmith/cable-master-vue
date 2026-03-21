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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
}
.modal-footer {
  margin-top: 15px;
  text-align: center;
}
</style>
