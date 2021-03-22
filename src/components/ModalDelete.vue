<template>
  test
  <div>
    <div class="modal-mask" @click="isOpenClose">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header">
              Vous êtes sur de vouloir supprimer
            </slot>
          </div>

          <div class="modal-body">
            <h2>{{ cableToDelete.name }}</h2>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="validDelete">
                supprimer
              </button>
              <button class="modal-default-button" @click="isOpenClose">
                non
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { ref } from "vue";
export default {
  name: "ModalDelete",
  props: {
    cableToDelete: Object
  },
  emits: ["supp", "close"],
  setup(_, { emit }) {
    const validDelete = function() {
      console.log("validDelete", validDelete);
      emit("supp", validDelete.value);
    };
    const isOpenClose = function() {
      emit("close");
    };

    return {
      validDelete,
      isOpenClose
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
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}
.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}
.modal-container {
  width: 300px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: rgb(167, 159, 159);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}
.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}
.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
  padding: 10px;
  margin: 10px;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
