<template>
  <div class="modal-mask">
    <div class="modal-wrapper" @click="emit('close')"></div>
    <div class="modal-container">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalView",

  emit: ["close"],
  setup(_, { emit }) {
    return {
      emit
    };
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  display: table;
  transition: opacity 0.3s ease;
}
.modal-container {
  width: 300px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: rgb(248, 238, 238);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}
.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}
</style>
