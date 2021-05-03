<template>
  <div class="main" v-for="cable in allCables" :key="cable.cableid">
    <form @submit.prevent="updateOrder()">
      <div class="number">
        <div>
          <input type="checkbox" v-model="cable.tfc_done" />
        </div>
        <div class="name">
          <h4>{{ cable.name }}</h4>
        </div>
        <!-- <div style="font-size:10px;line-height:3px;padding-right:3px">
          {{ calculateTotal(cable) }}
        </div> -->
        <div :class="calculateTotalFc(cable) === 0 ? 'ready' : 'countfc'">
          <p>
            {{ calculateTotalFc(cable) }}
          </p>
        </div>
        <input
          name="tfc1"
          v-model="cable.tfc1"
          @mousedown="cable.tfc1 = parseInt(cable.tfc1 || 0) + 1"
          v-longclick="() => changeValue({ cable, prop: 'tfc1' })"
          autocomplete="off"
        />

        <input
          name="tfc2"
          v-model="cable.tfc2"
          @mousedown="cable.tfc2 = parseInt(cable.tfc2 || 0) + 1"
          v-longclick="() => changeValue({ cable, prop: 'tfc2' })"
          autocomplete="off"
        />

        <input
          name="tfc3"
          v-model="cable.tfc3"
          @mousedown="cable.tfc3 = parseInt(cable.tfc3 || 0) + 1"
          v-longclick="() => changeValue({ cable, prop: 'tfc3' })"
          autocomplete="off"
        />

        <input
          name="tfc4"
          v-model="cable.tfc4"
          @mousedown="cable.tfc4 = parseInt(cable.tfc4 || 0) + 1"
          v-longclick="() => changeValue({ cable, prop: 'tfc4' })"
          autocomplete="off"
        />

        <input
          name="tfc5"
          v-model="cable.tfc5"
          @mousedown="cable.tfc5 = parseInt(cable.tfc5 || 0) + 1"
          v-longclick="() => changeValue({ cable, prop: 'tfc5' })"
          autocomplete="off"
        />
      </div>
    </form>
  </div>
</template>
<script>
import { computed, ref } from "vue";

export default {
  name: "FlightCaseManagement",
  props: {
    cables: {
      type: Array
    },
    cableType: {
      type: String
    },
    showMyList: {
      type: Boolean
    },
    affaireSelected: {
      type: Array
    },
    typechoose: {
      type: String
    }
  },
  emits: ["updateorder"],
  directives: {
    longclick: {
      beforeMount(el, binding, vNode) {
        let delay = 400;
        let interval = 100;
        if (typeof binding.value !== "function") {
          const compName = vNode.context.name;
          let warn = `[longclick:] provided expression '${binding.expression}' is not a function, but has to be`;
          if (compName) {
            warn += `Found in component '${compName}' `;
          }
          console.warn(warn); // eslint-disable-line
        }
        let pressTimer = null;
        let pressInterval = null;
        const start = e => {
          if (e.type === "click" && e.button !== 0) {
            return;
          }
          if (pressTimer === null) {
            pressTimer = setTimeout(() => {
              if (interval && interval > 0) {
                pressInterval = setInterval(() => {
                  handler();
                }, interval);
              }
              handler();
            }, delay);
          }
        };
        // Cancel Timeout
        const cancel = () => {
          if (pressTimer !== null) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
          if (pressInterval) {
            clearInterval(pressInterval);
            pressInterval = null;
          }
        };
        // Run Function
        const handler = e => {
          binding.value(e);
        };
        ["mousedown", "touchstart"].forEach(e => el.addEventListener(e, start));
        ["click", "mouseout", "touchend", "touchcancel"].forEach(e =>
          el.addEventListener(e, cancel)
        );
      }
    }
  },

  setup(props, context) {
    let allCables = ref([]);
    let count = ref("");
    let counter = ref(0);
    let tfc_done = ref("");

    function calculateTotal(cable) {
      return (
        parseInt(cable.z1 || 0) +
        parseInt(cable.z2 || 0) +
        parseInt(cable.z3 || 0) +
        parseInt(cable.z4 || 0) +
        parseInt(cable.z5 || 0) +
        parseInt(cable.spare_count || 0)
      );
    }

    allCables = computed(() => {
      return props.cables.filter(c => calculateTotal(c) > 0);
    });

    function calculateTotalFc(cable) {
      return (
        parseInt(calculateTotal(cable)) -
        parseInt(cable.tfc1 || 0) -
        parseInt(cable.tfc2 || 0) -
        parseInt(cable.tfc3 || 0) -
        parseInt(cable.tfc4 || 0) -
        parseInt(cable.tfc5 || 0)
      );
    }

    function updateOrder() {
      console.log("updateOrder / allCables", allCables);
      context.emit("updateorder", allCables);
    }

    // data is now an object with two properties: { cable, prop: 'tfc1' } or { cable, prop: 'tfc2' } ...
    function changeValue(data) {
      // data.cable['tfc1'] or data.cable['tfc2'] ...
      data.cable[data.prop] -= 1;
      if (data.cable[data.prop] < 0) {
        data.cable[data.prop] = 0;
      }
    }

    function setColorIndicator(cable) {
      if (cable.total <= cable.reserved) {
        return "available-alert";
      } else if (cable.reserved < cable.total < 2 * cable.reserved) {
        return "available-warning";
      } else {
        return "available-info";
      }
    }

    return {
      calculateTotal,
      calculateTotalFc,
      allCables,
      count,
      setColorIndicator,
      updateOrder,
      changeValue,
      counter,
      tfc_done
    };
  }
};
</script>

<style scoped>
.countfc {
  margin-right: 10px;
}
.countfc p {
  /* line-height: 10px; */
  padding-top: 5px;
  border: 1px solid black;
  background: rgb(224, 222, 222);
  width: 30px;
  height: 23px;
}
input {
  padding: 5px;
  cursor: pointer;
}
.info-content {
  height: 14px;
  margin: 0px 0px 10px 0px;
  line-height: 0;
}
.info {
  font-size: 12px;
  width: 325px;
  height: 20px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
  font-style: italic;
  border-bottom: 1px solid;
}

.link {
  height: 18px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
  /* line-height: 10; */
}
.main {
  margin: 0px;
  padding: 0px;
}

.name h4 {
  cursor: pointer;
  font-weight: 500;
  text-align: left;
  width: 100px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
  margin: 0px;
}
.number {
  display: flex;
  height: 35px !important;
  /* border-width: 0px 0px 1px 0px; */
  /* align-content: flex-start; */
  align-items: center;
  /* padding: 0px !important; */
}

.number input {
  width: 15px;
  margin: 4px;
}
.post {
  display: flex;
  flex-direction: column;
  align-items: center;
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tfc3 {
  background-color: rgb(248, 245, 245);
  border: 1px solid rgb(12, 12, 2);
}
.ready {
  color: white;
  background-color: #4dcc59;
  line-height: 6px;
  padding-top: 5px;
  border: 1px solid green;
  width: 30px;
  height: 23px;
  margin-top: 5px;
  /* margin-left: 4px; */
  margin-right: 9px;
}
.ready p {
  margin-top: 5px;
}
</style>
